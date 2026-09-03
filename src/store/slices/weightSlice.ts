import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { ApiFailure, ListResponse, WeightEntry, toApiFailure } from '../../api/types';
import { RangeKey, rangeFromISO } from '../../lib/dates';

export type WeightListItem = WeightEntry & { pending?: boolean };

interface WeightState {
  clientId: string | null;
  items: WeightListItem[];
  totalCount: number;
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  error: ApiFailure | null;
  latestFetchId: string | null;
  adding: boolean;
  deleteStash: Record<string, WeightEntry>;
}

const initialState: WeightState = {
  clientId: null,
  items: [],
  totalCount: 0,
  status: 'idle',
  error: null,
  latestFetchId: null,
  adding: false,
  deleteStash: {},
};

const byDateDesc = (a: WeightEntry, b: WeightEntry) =>
  Date.parse(b.dateISO) - Date.parse(a.dateISO);

export const fetchWeight = createAsyncThunk<
  { items: WeightEntry[]; totalCount: number },
  { clientId: string; range: RangeKey },
  { rejectValue: ApiFailure }
>('weight/fetch', async ({ clientId, range }, { rejectWithValue }) => {
  try {
    const from = rangeFromISO(range);
    const { data } = await apiClient.get<ListResponse<WeightEntry>>(
      `/clients/${clientId}/weight`,
      { params: from ? { from } : undefined },
    );

    let totalCount = data.items.length;
    if (range === 'all') {
      totalCount = data.items.length;
    } else if (data.items.length === 0) {
      const allRes = await apiClient.get<ListResponse<WeightEntry>>(
        `/clients/${clientId}/weight`,
      );
      totalCount = allRes.data.items.length;
    }

    return { items: data.items, totalCount };
  } catch (err) {
    return rejectWithValue(toApiFailure(err));
  }
});

export const addWeight = createAsyncThunk<
  WeightEntry,
  { clientId: string; dateISO: string; weightKg: number; note: string | null },
  { rejectValue: ApiFailure }
>('weight/add', async ({ clientId, dateISO, weightKg, note }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<WeightEntry>(`/clients/${clientId}/weight`, {
      dateISO,
      weightKg,
      note,
    });
    return data;
  } catch (err) {
    return rejectWithValue(toApiFailure(err));
  }
});

export const deleteWeight = createAsyncThunk<
  void,
  { entryId: string },
  { rejectValue: ApiFailure }
>('weight/delete', async ({ entryId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/weight/${entryId}`);
  } catch (err) {
    const failure = toApiFailure(err);
    if (failure.status === 404) {
      return;
    }
    return rejectWithValue(failure);
  }
});

const weightSlice = createSlice({
  name: 'weight',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchWeight.pending, (state, action) => {
        state.latestFetchId = action.meta.requestId;
        state.error = null;
        if (state.clientId !== action.meta.arg.clientId) {
          state.clientId = action.meta.arg.clientId;
          state.items = [];
          state.totalCount = 0;
        }
        state.status = 'loading';
      })
      .addCase(fetchWeight.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestFetchId) {
          return;
        }
        state.status = 'loaded';
        state.items = [...action.payload.items].sort(byDateDesc);
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchWeight.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestFetchId) {
          return;
        }
        state.status = 'failed';
        state.error = action.payload ?? {
          status: null,
          code: 'UNKNOWN',
          message: 'Could not load weight entries.',
        };
      })

      .addCase(addWeight.pending, (state, action) => {
        state.adding = true;
        const { clientId, dateISO, weightKg, note } = action.meta.arg;
        if (state.clientId !== clientId) {
          return;
        }
        state.totalCount += 1;
        state.items = [
          ...state.items,
          {
            id: `optimistic-${action.meta.requestId}`,
            clientId,
            dateISO,
            weightKg,
            note,
            source: 'coach',
            pending: true,
          },
        ].sort(byDateDesc);
      })
      .addCase(addWeight.fulfilled, (state, action) => {
        state.adding = false;
        state.items = state.items
          .map(item =>
            item.id === `optimistic-${action.meta.requestId}` ? action.payload : item,
          )
          .sort(byDateDesc);
      })
      .addCase(addWeight.rejected, (state, action) => {
        state.adding = false;
        state.totalCount = Math.max(0, state.totalCount - 1);
        state.items = state.items.filter(
          item => item.id !== `optimistic-${action.meta.requestId}`,
        );
      })
      .addCase(deleteWeight.pending, (state, action) => {
        const entry = state.items.find(item => item.id === action.meta.arg.entryId);
        if (entry) {
          state.deleteStash[action.meta.requestId] = entry;
          state.items = state.items.filter(item => item.id !== entry.id);
          state.totalCount = Math.max(0, state.totalCount - 1);
        }
      })
      .addCase(deleteWeight.fulfilled, (state, action) => {
        delete state.deleteStash[action.meta.requestId];
      })
      .addCase(deleteWeight.rejected, (state, action) => {
        const entry = state.deleteStash[action.meta.requestId];
        if (entry) {
          delete state.deleteStash[action.meta.requestId];
          state.totalCount += 1;
          state.items = [...state.items, entry].sort(byDateDesc);
        }
      });
  },
});

export default weightSlice.reducer;
