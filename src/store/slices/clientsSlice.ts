import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client';
import { ApiFailure, Client, ListResponse, toApiFailure } from '../../api/types';

interface ClientsState {
  items: Client[];
  status: 'idle' | 'loading' | 'refreshing' | 'loaded' | 'failed';
  error: ApiFailure | null;
}

const initialState: ClientsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchClients = createAsyncThunk<
  Client[],
  { refresh?: boolean } | undefined,
  { rejectValue: ApiFailure }
>('clients/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get<ListResponse<Client>>('/clients');
    return data.items;
  } catch (err) {
    return rejectWithValue(toApiFailure(err));
  }
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchClients.pending, (state, action) => {
        state.status = action.meta.arg?.refresh ? 'refreshing' : 'loading';
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = 'loaded';
        state.items = [...action.payload].sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? {
          status: null,
          code: 'UNKNOWN',
          message: 'Could not load clients.',
        };
      });
  },
});

export default clientsSlice.reducer;
