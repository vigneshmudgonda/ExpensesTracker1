
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.name.trim() || !form.email.trim() || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await register(form.name, form.email, form.password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 px-4 py-10">
            <form
                className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 sm:p-10"
                onSubmit={handleSubmit}
            >
                <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Create Account
                </h1>

                <p className="mb-8 text-center text-sm text-gray-500">
                    Start tracking your expenses today.
                </p>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                >
                    Full name
                </label>

                <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    className="mb-5 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                />

                <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                >
                    Email
                </label>

                <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
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
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="mb-6 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                />

                <button
                    disabled={loading}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? 'Creating account...' : 'Register'}
                </button>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already registered?{' '}
                    <Link
                        to="/login"
                        className="font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </main>
    );
}
