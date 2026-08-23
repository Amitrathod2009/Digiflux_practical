import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GirthSite } from '../../api/types';
import { WeightUnit } from '../../lib/units';
import { RangeKey } from '../../lib/dates';

interface PrefsState {
  weightUnit: WeightUnit;
  range: RangeKey;
  site: GirthSite;
}

const initialState: PrefsState = {
  weightUnit: 'kg',
  range: '90d',
  site: 'waist',
};

const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {
    setWeightUnit: (state, action: PayloadAction<WeightUnit>) => {
      state.weightUnit = action.payload;
    },
    setRange: (state, action: PayloadAction<RangeKey>) => {
      state.range = action.payload;
    },
    setSite: (state, action: PayloadAction<GirthSite>) => {
      state.site = action.payload;
    },
  },
});

export const { setWeightUnit, setRange, setSite } = prefsSlice.actions;
export default prefsSlice.reducer;
