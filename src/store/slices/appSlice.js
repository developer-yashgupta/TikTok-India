import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isGlobalMuted: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleGlobalMute: (state) => {
      state.isGlobalMuted = !state.isGlobalMuted;
    },
    setGlobalMute: (state, action) => {
      state.isGlobalMuted = action.payload;
    },
  },
});

export const { toggleGlobalMute, setGlobalMute } = appSlice.actions;

export default appSlice.reducer;
