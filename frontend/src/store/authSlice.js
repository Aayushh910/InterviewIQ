import { createSlice } from "@reduxjs/toolkit";
import { getToken, getUser, clearAuth } from "../utils/storage";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getUser(),
    token: getToken(),
    loading: false,
    error: null,
  },
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.token = payload.token;
      state.error = null;
    },
    setLoading(state, { payload }) {
      state.loading = payload;
    },
    setError(state, { payload }) {
      state.error = payload;
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      clearAuth();
    },
  },
});

export const { setCredentials, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
