
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter your email and password');
            return;
        }

        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 py-10">
            <form
                className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 sm:p-10"
                onSubmit={handleSubmit}
            >
                <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Welcome Back
                </h1>

                <p className="mb-8 text-center text-sm text-gray-500">
                    Log in to manage your expenses.
                </p>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                >
                    Email
                </label>

                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="mb-5 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                />

                <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                >
                    Password
                </label>

                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="mb-6 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                />

                <button
                    disabled={loading}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </main>
    );
}
