import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import API_CONFIG from '../../services/config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('🔐 Attempting login with:', { email, password: '***' });
        console.log('📡 API Base URL:', API_CONFIG.BASE_URL);

        try {
            const response = await api.post('/auth/login', { email, password });
            console.log('✅ Login response:', response.data);

            // Laravel returns 'access_token', not 'token'
            const token = response.data.access_token || response.data.token;
            const user = response.data.user;

            if (!token) {
                console.error('❌ No token in response:', response.data);
                throw new Error('No token received from server');
            }

            console.log('🎫 Token received:', token.substring(0, 20) + '...');
            console.log('👤 User data:', user);

            await login(token, user);
        } catch (err: any) {
            console.error('❌ LOGIN ERROR - Full details:');
            console.error('Error object:', err);
            console.error('Error message:', err.message);
            console.error('Error response:', err.response);
            console.error('Response status:', err.response?.status);
            console.error('Response data:', err.response?.data);
            console.error('Response headers:', err.response?.headers);
            console.error('Request config:', err.config);

            const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
            setError(errorMessage);
            console.error('📢 Displaying error to user:', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">
                        Homa<span className="text-primary">.</span>
                    </h1>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account to continue
                    </p>
                </div>

                <form className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>

                    <div className="text-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                        <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
