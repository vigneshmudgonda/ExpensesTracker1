
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../context/AuthContext";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
});

function formatCurrency(amount) {
    return currencyFormatter.format(Number(amount) || 0);
}

function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsedDate);
}

function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const incomeCategories = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Other",
];

const expenseCategories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Health",
    "Education",
    "Other",
];

function SummaryCard({ title, amount, color }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">
                {title}
            </p>

            <p className={`mt-3 break-words text-2xl font-bold ${color}`}>
                {formatCurrency(amount)}
            </p>
        </div>
    );
}

function TransactionRow({
    transaction,
    onDelete,
    deletingId,
}) {
    const isIncome = transaction.type === "income";
    const isDeleting = deletingId === transaction._id;

    return (
        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                        isIncome
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                    }`}
                >
                    {isIncome ? "+" : "−"}
                </div>

                <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">
                        {transaction.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                        {transaction.category} · {formatDate(transaction.date)}
                    </p>
                </div>
            </div>

            <p
                className={`font-bold ${
                    isIncome
                        ? "text-emerald-600"
                        : "text-rose-600"
                }`}
            >
                {isIncome ? "+" : "−"}
                {formatCurrency(transaction.amount)}
            </p>

            <button
                type="button"
                onClick={() => onDelete(transaction._id)}
                disabled={isDeleting}
                aria-label={`Delete ${transaction.title}`}
                className="w-fit rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isDeleting ? "Deleting..." : "Delete"}
            </button>
        </div>
    );
}

export default function Transactions() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [deletingId, setDeletingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [dateFilter, setDateFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        type: "expense",
        category: "",
        date: getLocalDate(),
    });

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/transactions");
            const data = response.data;

            const transactionList = Array.isArray(data)
                ? data
                : Array.isArray(data?.transactions)
                    ? data.transactions
                    : null;

            if (!transactionList) {
                throw new Error(
                    "Unexpected transactions response from server."
                );
            }

            setTransactions(transactionList);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Could not load transactions. Please check your login session."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    const categories = useMemo(
        () => [
            ...new Set(
                transactions
                    .map((item) => item.category)
                    .filter(Boolean)
            ),
        ].sort(),
        [transactions]
    );

    const filteredTransactions = useMemo(() => {
        return transactions.filter((item) => {
            const itemDate = item.date
                ? new Date(item.date)
                : null;

            const matchesDate =
                !dateFilter ||
                (
                    itemDate &&
                    !Number.isNaN(itemDate.getTime()) &&
                    `${itemDate.getFullYear()}-${String(
                        itemDate.getMonth() + 1
                    ).padStart(2, "0")}-${String(
                        itemDate.getDate()
                    ).padStart(2, "0")}` === dateFilter
                );

            const matchesCategory =
                categoryFilter === "all" ||
                item.category === categoryFilter;

            const matchesType =
                typeFilter === "all" ||
                item.type === typeFilter;

            return matchesDate && matchesCategory && matchesType;
        });
    }, [
        transactions,
        dateFilter,
        categoryFilter,
        typeFilter,
    ]);

    const totals = useMemo(() => {
        return filteredTransactions.reduce(
            (result, item) => {
                const amount = Number(item.amount) || 0;

                if (item.type === "income") {
                    result.income += amount;
                }

                if (item.type === "expense") {
                    result.expenses += amount;
                }

                return result;
            },
            { income: 0, expenses: 0 }
        );
    }, [filteredTransactions]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "type" ? { category: "" } : {}),
        }));

        setError("");
        setSuccess("");
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const amount = Number(formData.amount);

        if (!formData.title.trim()) {
            setError("Please enter a transaction title.");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Please enter an amount greater than zero.");
            return;
        }

        if (!formData.category) {
            setError("Please select a category.");
            return;
        }

        if (!formData.date) {
            setError("Please select a transaction date.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                title: formData.title.trim(),
                amount,
                type: formData.type,
                category: formData.category,
                date: formData.date,
            };

            const response = await api.post(
                "/transactions",
                payload
            );

            const newTransaction =
                response.data?.transaction ?? response.data;

            if (newTransaction?._id) {
                setTransactions((current) => [
                    newTransaction,
                    ...current,
                ]);
            } else {
                await fetchTransactions();
            }

            setFormData({
                title: "",
                amount: "",
                type: "expense",
                category: "",
                date: getLocalDate(),
            });

            setSuccess("Transaction added successfully!");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to add transaction. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this transaction?"
            )
        ) {
            return;
        }

        setError("");
        setSuccess("");
        setDeletingId(id);

        try {
            await api.delete(`/transactions/${id}`);

            setTransactions((current) =>
                current.filter((item) => item._id !== id)
            );

            setSuccess("Transaction deleted successfully!");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete transaction."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const clearFilters = () => {
        setDateFilter("");
        setCategoryFilter("all");
        setTypeFilter("all");
    };

    const availableCategories =
        formData.type === "income"
            ? incomeCategories
            : expenseCategories;

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                            Expense Tracker
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Transactions
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Track and manage your income and expenses.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={fetchTransactions}
                            disabled={loading}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Feedback messages */}
                {error && (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
                    >
                        {success}
                    </div>
                )}

                {/* Summary cards */}
                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SummaryCard
                        title="Total Income"
                        amount={totals.income}
                        color="text-emerald-600"
                    />

                    <SummaryCard
                        title="Total Expenses"
                        amount={totals.expenses}
                        color="text-rose-600"
                    />

                    <SummaryCard
                        title="Balance"
                        amount={totals.income - totals.expenses}
                        color={
                            totals.income - totals.expenses >= 0
                                ? "text-indigo-600"
                                : "text-rose-600"
                        }
                    />
                </section>

                {/* Add transaction form */}
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-6">
                        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                            Manage money
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                            Add a transaction
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Record your income or track a new expense.
                        </p>
                    </div>

                    <form
                        onSubmit={handleAddTransaction}
                        className="space-y-5"
                    >
                        {/* Income / expense selection */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Transaction type
                            </label>

                            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            type: "income",
                                            category: "",
                                        }))
                                    }
                                    className={`rounded-xl border px-4 py-3 font-semibold transition ${
                                        formData.type === "income"
                                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    + Income
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            type: "expense",
                                            category: "",
                                        }))
                                    }
                                    className={`rounded-xl border px-4 py-3 font-semibold transition ${
                                        formData.type === "expense"
                                            ? "border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-100"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    − Expense
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                            {/* Title */}
                            <label className="text-sm font-medium text-slate-700">
                                Transaction title

                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder={
                                        formData.type === "income"
                                            ? "e.g. Monthly salary"
                                            : "e.g. Grocery shopping"
                                    }
                                    maxLength={100}
                                    required
                                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </label>

                            {/* Amount */}
                            <label className="text-sm font-medium text-slate-700">
                                Amount (₹)

                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 25000"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </label>

                            {/* Category */}
                            <label className="text-sm font-medium text-slate-700">
                                Category

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="">
                                        Select category
                                    </option>

                                    {availableCategories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Date */}
                            <label className="text-sm font-medium text-slate-700">
                                Transaction date

                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                {formData.type === "income"
                                    ? "Income will be added to your balance."
                                    : "Expenses will be deducted from your balance."}
                            </p>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`rounded-xl px-6 py-3.5 font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    formData.type === "income"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                            >
                                {submitting
                                    ? "Adding transaction..."
                                    : `Add ${
                                        formData.type === "income"
                                            ? "Income"
                                            : "Expense"
                                    }`}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Filters */}
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">
                            Filter transactions
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Narrow the list by date, category, or type.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-sm font-medium text-slate-700">
                            Date

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) =>
                                    setDateFilter(e.target.value)
                                }
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Category

                            <select
                                value={categoryFilter}
                                onChange={(e) =>
                                    setCategoryFilter(e.target.value)
                                }
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="all">
                                    All categories
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Transaction type

                            <select
                                value={typeFilter}
                                onChange={(e) =>
                                    setTypeFilter(e.target.value)
                                }
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="all">
                                    Income and expenses
                                </option>
                                <option value="income">
                                    Income only
                                </option>
                                <option value="expense">
                                    Expenses only
                                </option>
                            </select>
                        </label>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                </section>

                {/* Transaction list */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-bold text-slate-900">
                            Recent transactions
                        </h2>

                        <p className="text-sm text-slate-500">
                            {filteredTransactions.length} of{" "}
                            {transactions.length} transactions
                        </p>
                    </div>

                    {loading ? (
                        <p className="p-8 text-center text-slate-500">
                            Loading transactions...
                        </p>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-500">
                                ₹
                            </div>

                            <h3 className="mt-4 font-bold text-slate-800">
                                No transactions found
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Add a transaction above or change your filters.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredTransactions.map((transaction) => (
                                <TransactionRow
                                    key={transaction._id}
                                    transaction={transaction}
                                    onDelete={handleDelete}
                                    deletingId={deletingId}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
