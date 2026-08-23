import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, setAuthToken } from '../../api/client';
import { ApiFailure, Coach, LoginResponse, toApiFailure } from '../../api/types';

const TOKEN_KEY = 'molt/token';
const COACH_KEY = 'molt/coach';

export type AuthStatus = 'bootstrapping' | 'signedOut' | 'signingIn' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  coach: Coach | null;
  error: ApiFailure | null;
  sessionExpired: boolean;
}

const initialState: AuthState = {
  status: 'bootstrapping',
  token: null,
  coach: null,
  error: null,
  sessionExpired: false,
};

export const bootstrapSession = createAsyncThunk<LoginResponse | null>(
  'auth/bootstrap',
  async () => {
    const [[, token], [, coachJson]] = await AsyncStorage.multiGet([TOKEN_KEY, COACH_KEY]);
    if (!token || !coachJson) {
      return null;
    }
    setAuthToken(token);
    return { token, coach: JSON.parse(coachJson) as Coach };
  },
);

export const signIn = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: ApiFailure }
>('auth/signIn', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    setAuthToken(data.token);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [COACH_KEY, JSON.stringify(data.coach)],
    ]);
    return data;
  } catch (err) {
    return rejectWithValue(toApiFailure(err));
  }
});

export const signOut = createAsyncThunk<void, { expired?: boolean } | undefined>(
  'auth/signOut',
  async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, COACH_KEY]);
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'signedIn';
          state.token = action.payload.token;
          state.coach = action.payload.coach;
        } else {
          state.status = 'signedOut';
        }
      })
      .addCase(bootstrapSession.rejected, state => {
        state.status = 'signedOut';
      })
      .addCase(signIn.pending, state => {
        state.status = 'signingIn';
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.status = 'signedIn';
        state.token = action.payload.token;
        state.coach = action.payload.coach;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'signedOut';
        state.error = action.payload ?? {
          status: null,
          code: 'UNKNOWN',
          message: 'Sign in failed. Please try again.',
        };
      })
      .addCase(signOut.pending, (state, action) => {
        state.status = 'signedOut';
        state.token = null;
        state.coach = null;
        state.error = null;
        state.sessionExpired = action.meta.arg?.expired ?? false;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
