import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { ApiFailure, GirthEntry, GirthSite, ListResponse, toApiFailure } from '../../api/types';
import { RangeKey, rangeFromISO } from '../../lib/dates';

interface GirthState {
  clientId: string | null;
  site: GirthSite | null;
  items: GirthEntry[];
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  error: ApiFailure | null;
  latestFetchId: string | null;
}

const initialState: GirthState = {
  clientId: null,
  site: null,
  items: [],
  status: 'idle',
  error: null,
  latestFetchId: null,
};

const byDateDesc = (a: GirthEntry, b: GirthEntry) =>
  Date.parse(b.dateISO) - Date.parse(a.dateISO);

export const fetchGirth = createAsyncThunk<
  GirthEntry[],
  { clientId: string; site: GirthSite; range: RangeKey },
  { rejectValue: ApiFailure }
>('girth/fetch', async ({ clientId, site, range }, { rejectWithValue }) => {
  try {
    const from = rangeFromISO(range);
    const { data } = await apiClient.get<ListResponse<GirthEntry>>(
      `/clients/${clientId}/girth`,
      { params: { site, ...(from ? { from } : {}) } },
    );
    return data.items;
  } catch (err) {
    return rejectWithValue(toApiFailure(err));
  }
});

const girthSlice = createSlice({
  name: 'girth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchGirth.pending, (state, action) => {
        state.latestFetchId = action.meta.requestId;
        state.error = null;
        const { clientId, site } = action.meta.arg;
        if (state.clientId !== clientId || state.site !== site) {
          state.clientId = clientId;
          state.site = site;
          state.items = [];
        }
        state.status = 'loading';
      })
      .addCase(fetchGirth.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestFetchId) {
          return;
        }
        state.status = 'loaded';
        state.items = [...action.payload].sort(byDateDesc);
      })
      .addCase(fetchGirth.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestFetchId) {
          return;
        }
        state.status = 'failed';
        state.error = action.payload ?? {
          status: null,
          code: 'UNKNOWN',
          message: 'Could not load girth entries.',
        };
      });
  },
});

export default girthSlice.reducer;
