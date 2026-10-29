
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
        <main className="transactions-page">
            <header className="transactions-header">
                <div>
                    <h1>Expenses Tracker</h1>
                    <p>Welcome, {user?.name}</p>
                </div>

                <button type="button" onClick={logout}>
                    Logout
                </button>
            </header>

            <section className="summary-grid">
                <article className="summary-card">
                    <p>Total Income</p>
                    <h2>{money(income)}</h2>
                </article>

                <article className="summary-card">
                    <p>Total Expenses</p>
                    <h2>{money(expenses)}</h2>
                </article>

                <article className="summary-card">
                    <p>Balance</p>
                    <h2>{money(income - expenses)}</h2>
                </article>
            </section>

            <section className="transaction-panel">
                <h2>Add Transaction</h2>

                {error && <p className="error" role="alert">{error}</p>}
                {message && <p className="success" role="status">{message}</p>}

                <form onSubmit={handleSubmit} className="transaction-form">
                    <label htmlFor="title">Description</label>
                    <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        maxLength={100}
                        placeholder="e.g. Monthly salary"
                        required
                    />

                    <label htmlFor="amount">Amount (₹)</label>
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
                    />

                    <label htmlFor="type">Transaction type</label>
                    <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>

                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                    >
                        {categories[form.type].map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="date">Date</label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Add Transaction'}
                    </button>
                </form>
            </section>

            <section className="transaction-panel">
                <h2>Recent Transactions</h2>

                {loading ? (
                    <p>Loading transactions...</p>
                ) : transactions.length === 0 ? (
                    <p>No transactions yet. Add your first one above.</p>
                ) : (
                    <div className="transaction-list">
                        {transactions.map((transaction) => (
                            <article
                                className="transaction-row"
                                key={transaction._id}
                            >
                                <div>
                                    <h3>{transaction.title}</h3>
                                    <p>
                                        {transaction.category} ·{' '}
                                        {new Date(transaction.date)
                                            .toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="transaction-actions">
                                    <strong className={
                                        transaction.type === 'income'
                                            ? 'income-text'
                                            : 'expense-text'
                                    }>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        {money(transaction.amount)}
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(transaction._id)}
                                        disabled={deletingId === transaction._id}
                                        aria-label={`Delete ${transaction.title}`}
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
