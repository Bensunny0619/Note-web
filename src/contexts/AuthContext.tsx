import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authStorage from '../services/authStorage';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

type User = {
    id: number;
    name: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    register: (token: string, user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    register: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const token = await authStorage.getItem('auth_token');
            const userData = await authStorage.getItem('user_data');

            if (token && userData) {
                setToken(token);
                setUser(JSON.parse(userData));

                // Verify token is still valid with backend
                try {
                    await api.get('/auth/me');
                    console.log('✅ Token validated successfully');
                } catch (error: any) {
                    if (error.response?.status === 401) {
                        console.log('❌ Token invalid, clearing auth state');
                        await authStorage.deleteItem('auth_token');
                        await authStorage.deleteItem('user_data');
                        setToken(null);
                        setUser(null);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load auth state', e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string, newUser: User) => {
        try {
            if (!token || typeof token !== 'string') {
                console.error('Invalid token provided to login:', token);
                throw new Error('Authentication failed: Missing token');
            }

            await authStorage.setItem('auth_token', token);
            await authStorage.setItem('user_data', JSON.stringify(newUser));
            setToken(token);
            setUser(newUser);

            navigate('/');
        } catch (e) {
            console.error('Login error', e);
            throw e;
        }
    };

    const register = async (token: string, newUser: User) => {
        await login(token, newUser);
    };

    const logout = async () => {
        try {
            try {
                await api.post('/auth/logout');
            } catch (error) {
                console.log('Backend logout failed, clearing local data anyway');
            }

            await authStorage.deleteItem('auth_token');
            await authStorage.deleteItem('user_data');
            setToken(null);
            setUser(null);

            navigate('/login');
        } catch (e) {
            console.error('Logout error', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
