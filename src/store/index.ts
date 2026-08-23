import { configureStore } from '@reduxjs/toolkit';
import { setOnUnauthorized } from '../api/client';
import authReducer, { signOut } from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import weightReducer from './slices/weightSlice';
import girthReducer from './slices/girthSlice';
import prefsReducer from './slices/prefsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    weight: weightReducer,
    girth: girthReducer,
    prefs: prefsReducer,
  },
});

setOnUnauthorized(() => {
  store.dispatch(signOut({ expired: true }));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
