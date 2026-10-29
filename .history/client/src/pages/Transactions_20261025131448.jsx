
import { useCallback, useEffect, useState } from 'react';
import { api, useAuth } from '../context/AuthContext';

const initialForm = {
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toLocaleDateString('en-CA')
};

const categories = {
    income: ['Salary', 'Business', 'Investment', 'Other'],
    expense: ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Other']
};

export default function Transactions() {
    const { user, logout } = useAuth();

    const [form, setForm] = useState(initialForm);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await api.get('/transactions');
            setTransactions(response.data.transactions);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load transactions'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            ...(name === 'type'
                ? { category: categories[value][0] }
                : {})
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');

        const amount = Number(form.amount);

        if (!form.title.trim() || !form.category) {
            setError('Please complete all fields');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Enter an amount greater than zero');
            return;
        }

        setSaving(true);

        try {
            const response = await api.post('/transactions', {
                ...form,
                amount
            });

            setTransactions((previous) =>
                [response.data.transaction, ...previous].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                )
            );

            setForm({
                ...initialForm,
                date: new Date().toLocaleDateString('en-CA')
            });

            setMessage('Transaction added successfully');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to add transaction'
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this transaction?')) return;

        setError('');
        setMessage('');
        setDeletingId(id);

        try {
            await api.delete(`/transactions/${id}`);

            setTransactions((previous) =>
                previous.filter((transaction) => transaction._id !== id)
            );

            setMessage('Transaction deleted successfully');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to delete transaction'
            );
        } finally {
            setDeletingId(null);
        }
    }

    const income = transactions
        .filter((item) => item.type === 'income')
        .reduce((total, item) => total + item.amount, 0);

    const expenses = transactions
        .filter((item) => item.type === 'expense')
        .reduce((total, item) => total + item.amount, 0);

    const money = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 sm:px-8">
            <header className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        Expenses Tracker
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Welcome, {user?.name}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                    Logout
                </button>
            </header>

            <section className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
                    <p className="text-sm font-semibold text-gray-500">
                        Total Income
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-emerald-600 sm:text-3xl">
                        {money(income)}
                    </h2>
                </article>

                <article className="rounded-2xl border border-red-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
                    <p className="text-sm font-semibold text-gray-500">
                        Total Expenses
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-red-500 sm:text-3xl">
                        {money(expenses)}
                    </h2>
                </article>

                <article className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg sm:col-span-2 lg:col-span-1">
                    <p className="text-sm font-semibold text-gray-500">
                        Balance
                    </p>
                    <h2 className={`mt-3 text-2xl font-bold sm:text-3xl ${income - expenses >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                        {money(income - expenses)}
                    </h2>
                </article>
            </section>

            <section className="mx-auto mt-8 max-w-6xl rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-200 sm:p-8">
                <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
                    Add Transaction
                </h2>

                {error && (
                    <p
                        className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                {message && (
                    <p
                        className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                        role="status"
                    >
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                        Description
                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            maxLength={100}
                            placeholder="e.g. Monthly salary"
                            required
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        />
                    </label>

                    <label htmlFor="amount" className="block text-sm font-semibold text-gray-700">
                        Amount (₹)
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            required
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        />
                    </label>

                    <label htmlFor="type" className="block text-sm font-semibold text-gray-700">
                        Transaction type
                        <select
                            id="type"
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </label>

                    <label htmlFor="category" className="block text-sm font-semibold text-gray-700">
                        Category
                        <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        >
                            {categories[form.type].map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label htmlFor="date" className="block text-sm font-semibold text-gray-700 sm:col-span-2">
                        Date
                        <input
                            id="date"
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                    >
                        {saving ? 'Saving...' : 'Add Transaction'}
                    </button>
                </form>
            </section>

            <section className="mx-auto mt-8 max-w-6xl rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-200 sm:p-8">
                <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
                    Recent Transactions
                </h2>

                {loading ? (
                    <p className="py-8 text-center text-gray-500">
                        Loading transactions...
                    </p>
                ) : transactions.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 px-4 py-10 text-center text-gray-500">
                        No transactions yet. Add your first one above.
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((transaction) => (
                            <article
                                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                                key={transaction._id}
                            >
                                <div className="min-w-0">
                                    <h3 className="break-words font-semibold text-gray-900">
                                        {transaction.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {transaction.category} ·{' '}
                                        {new Date(transaction.date)
                                            .toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <strong className={`whitespace-nowrap text-lg font-bold ${transaction.type === 'income'
                                        ? 'text-emerald-600'
                                        : 'text-red-500'
                                        }`}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        {money(transaction.amount)}
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(transaction._id)}
                                        disabled={deletingId === transaction._id}
                                        aria-label={`Delete ${transaction.title}`}
                                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {deletingId === transaction._id
                                            ? 'Deleting...'
                                            : 'Delete'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
