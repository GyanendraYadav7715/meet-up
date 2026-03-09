import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    user: null,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        loginSuccess: (state, action) => {
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.user = action.payload.user || null;
            state.isLoading = false;
            state.error = null;
            localStorage.setItem('token', action.payload.token);
        },
        logout: (state) => {
            state.token = null;
            state.isAuthenticated = false;
            state.user = null;
            state.isLoading = false;
            state.error = null;
            localStorage.removeItem('token');
        },
        setUser: (state, action) => {
            state.user = action.payload;
        }
    },
});

export const { setLoading, setError, loginSuccess, logout, setUser } = authSlice.actions;

export default authSlice.reducer;
