import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout, setLoading, setError, setUser } from '../store/slices/authSlice';
import { useCallback } from 'react';

export const useAuth = () => {
    const dispatch = useDispatch();
    const { token, isAuthenticated, user, isLoading, error } = useSelector((state) => state.auth);

    const login = useCallback(async (email, password) => {
        dispatch(setLoading(true));
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.token) {
                dispatch(loginSuccess({ token: data.token, user: data.user }));
                return true;
            } else {
                dispatch(setError(data.message));
                return false;
            }
        } catch (err) {
            dispatch(setError(err.message));
            return false;
        }
    }, [dispatch]);

    const registerUser = useCallback(async (name, email, password) => {
        dispatch(setLoading(true));
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (data.token) {
                dispatch(loginSuccess({ token: data.token, user: data.user }));
                return true;
            } else {
                dispatch(setError(data.message));
                return false;
            }
        } catch (err) {
            dispatch(setError(err.message));
            return false;
        }
    }, [dispatch]);

    const performLogout = useCallback(() => {
        dispatch(logout());
        // optional: call backend /refresh logout to clear httpOnly cookie
    }, [dispatch]);

    return {
        token,
        isAuthenticated,
        user,
        isLoading,
        error,
        login,
        registerUser,
        logout: performLogout,
    };
};
