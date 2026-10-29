import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
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

    if (Number.isNaN(parsedDate.getTime())) return "—";

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

function normalizeTransaction(item) {
    const rawType = String(
        item.type ?? item.transactionType ?? ""
    ).toLowerCase().trim();

    let type = rawType;

    if (["income", "incomes", "earning", "earnings"].includes(rawType)) {
        type = "income";
    } else if (
        ["expense", "expenses", "expenditure", "spending"].includes(rawType)
    ) {
        type = "expense";
    }

    return {
        ...item,
        type,
        amount: Number(item.amount) || 0,
        title: item.title ?? item.name ?? "Untitled transaction",
        category: item.category ?? "Other",
    };
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
    "Rent",
    "Entertainment",
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

function TransactionRow({ transaction, onDelete, deletingId }) {
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

                    <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            isIncome
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                        }`}
                    >
                        {isIncome ? "Income" : "Expense"}
                    </span>
                </div>
            </div>

            <p
                className={`font-bold ${
                    isIncome ? "text-emerald-600" : "text-rose-600"
                }`}
            >
                {isIncome ? "+" : "−"}
                {formatCurrency(transaction.amount)}
            </p>

            <button
                type="button"
                onClick={() => onDelete(transaction._id)}
                disabled={isDeleting || !transaction._id}
                className="w-fit rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
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

    // Fetch transactions from the backend.
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
                    : Array.isArray(data?.data)
                        ? data.data
                        : null;

            if (!transactionList) {
                console.error("Unexpected API response:", data);

                throw new Error(
                    "The server response does not contain a transaction list."
                );
            }

            const normalized = transactionList.map(normalizeTransaction);

            console.log("Loaded transactions:", normalized);

            setTransactions(normalized);
        } catch (err) {
            console.error("Fetch transactions error:", err);

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

    // Categories for the filter.
    const categories = useMemo(() => {
        return [
            ...new Set(
                transactions
                    .map((item) => item.category)
                    .filter(Boolean)
            ),
        ].sort();
    }, [transactions]);

    // Apply filters to the list.
    const filteredTransactions = useMemo(() => {
        return transactions.filter((item) => {
            let matchesDate = true;

            if (dateFilter) {
                if (!item.date) {
                    matchesDate = false;
                } else {
                    const parsedDate = new Date(item.date);

                    if (Number.isNaN(parsedDate.getTime())) {
                        matchesDate = false;
                    } else {
                        const localDate = [
                            parsedDate.getFullYear(),
                            String(parsedDate.getMonth() + 1).padStart(2, "0"),
                            String(parsedDate.getDate()).padStart(2, "0"),
                        ].join("-");

                        matchesDate = localDate === dateFilter;
                    }
                }
            }

            const matchesCategory =
                categoryFilter === "all" ||
                item.category === categoryFilter;

            const matchesType =
                typeFilter === "all" ||
                item.type === typeFilter;

            return matchesDate && matchesCategory && matchesType;
        });
    }, [transactions, dateFilter, categoryFilter, typeFilter]);

    // Calculate totals from the filtered transactions.
    const totals = useMemo(() => {
        return filteredTransactions.reduce(
            (result, item) => {
                const amount = Number(item.amount) || 0;

                if (item.type === "income") {
                    result.income += amount;
                } else if (item.type === "expense") {
                    result.expenses += amount;
                }

                return result;
            },
            { income: 0, expenses: 0 }
        );
    }, [filteredTransactions]);

    const balance = totals.income - totals.expenses;

    // Pie chart: expense totals grouped by category.
// Uses all transactions, regardless of the current list filters.
const expenseChartData = useMemo(() => {
    const categoryTotals = {};

    transactions.forEach((item) => {
        if (item.type !== "expense") return;

        const category = item.category || "Other";
        categoryTotals[category] =
            (categoryTotals[category] || 0) + item.amount;
    });

    return Object.entries(categoryTotals)
        .map(([name, value]) => ({
            name,
            value,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);
}, [transactions]);

// Bar chart: monthly income versus expenses for the last six months.
const monthlyChartData = useMemo(() => {
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - 5 + index,
            1
        );

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
        ].join("-");

        return {
            key,
            month: new Intl.DateTimeFormat("en-IN", {
                month: "short",
                year: "2-digit",
            }).format(date),
            income: 0,
            expenses: 0,
        };
    });

    const monthlyTotals = Object.fromEntries(
        months.map((month) => [
            month.key,
            { ...month },
        ])
    );

    transactions.forEach((item) => {
        if (!item.date) return;

        const date = new Date(item.date);

        if (Number.isNaN(date.getTime())) return;

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
        ].join("-");

        if (!monthlyTotals[key]) return;

        if (item.type === "income") {
            monthlyTotals[key].income += item.amount;
        } else if (item.type === "expense") {
            monthlyTotals[key].expenses += item.amount;
        }
    });

    return months.map((month) => monthlyTotals[month.key]);
}, [transactions]);

const chartColors = [
    "#6366f1",
    "#f43f5e",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
    "#64748b",
];

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "type" ? { category: "" } : {}),
        }));

        setError("");
        setSuccess("");
    };

    // Add a new income or expense.
    const handleAddTransaction = async (event) => {
        event.preventDefault();

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

            const response = await api.post("/transactions", payload);

            const returnedData = response.data?.transaction ?? response.data;
            const newTransaction = returnedData?._id
                ? normalizeTransaction(returnedData)
                : null;

            if (newTransaction) {
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
            console.error("Add transaction error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to add transaction. Please check your backend route."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Delete a transaction.
    const handleDelete = async (id) => {
        if (!id) {
            setError("Cannot delete this transaction because its ID is missing.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this transaction?")) {
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
            console.error("Delete transaction error:", err);

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

                {/* Page header */}
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
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60"
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-rose-700"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Error and success messages */}
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
                        amount={balance}
                        color={balance >= 0 ? "text-indigo-600" : "text-rose-600"}
                    />
                </section>

                {/* Charts */}
<section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

    {/* Category-wise expense pie chart */}
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Spending breakdown
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
                Expenses by category
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                See which categories use the most money.
            </p>
        </div>

        {expenseChartData.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 text-center text-sm text-slate-500">
                Add an expense to see your category breakdown.
            </div>
        ) : (
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={expenseChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="72%"
                            innerRadius="42%"
                            paddingAngle={3}
                            stroke="white"
                            strokeWidth={2}
                        >
                            {expenseChartData.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill={
                                        chartColors[
                                            index % chartColors.length
                                        ]
                                    }
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            formatter={(value) => formatCurrency(value)}
                        />

                        <Legend
                            verticalAlign="bottom"
                            height={36}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
                Total expenses
            </p>

            <p className="mt-1 text-xl font-bold text-rose-600">
                {formatCurrency(
                    expenseChartData.reduce(
                        (total, item) => total + item.value,
                        0
                    )
                )}
            </p>
        </div>
    </div>

    {/* Monthly income vs expense bar chart */}
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Financial overview
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
                Monthly trends
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                Compare your income and spending over six months.
            </p>
        </div>

        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={monthlyChartData}
                    margin={{
                        top: 10,
                        right: 8,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                        tickFormatter={(value) =>
                            value >= 1000
                                ? `₹${(value / 1000).toFixed(0)}k`
                                : `₹${value}`
                        }
                    />

                    <Tooltip
                        formatter={(value) => formatCurrency(value)}
                    />

                    <Legend />

                    <Bar
                        dataKey="income"
                        name="Income"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={38}
                    />

                    <Bar
                        dataKey="expenses"
                        name="Expenses"
                        fill="#f43f5e"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={38}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div>
                <p className="text-sm text-slate-500">
                    Six-month income
                </p>

                <p className="mt-1 break-words font-bold text-emerald-600">
                    {formatCurrency(
                        monthlyChartData.reduce(
                            (total, item) => total + item.income,
                            0
                        )
                    )}
                </p>
            </div>

            <div>
                <p className="text-sm text-slate-500">
                    Six-month expenses
                </p>

                <p className="mt-1 break-words font-bold text-rose-600">
                    {formatCurrency(
                        monthlyChartData.reduce(
                            (total, item) => total + item.expenses,
                            0
                        )
                    )}
                </p>
            </div>
        </div>
    </div>
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
                            Record your income or add a new expense.
                        </p>
                    </div>

                    <form onSubmit={handleAddTransaction} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Transaction type
                            </label>

                            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            type: "income",
                                            category: "",
                                        }))
                                    }
                                    className={`rounded-xl border px-4 py-3 font-semibold ${
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
                                        setFormData((previous) => ({
                                            ...previous,
                                            type: "expense",
                                            category: "",
                                        }))
                                    }
                                    className={`rounded-xl border px-4 py-3 font-semibold ${
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
                                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </label>

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
                                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Category

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="">Select category</option>

                                    {availableCategories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Transaction date

                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </label>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                {formData.type === "income"
                                    ? "Income will be added to your balance."
                                    : "Expenses will be deducted from your balance."}
                            </p>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`rounded-xl px-6 py-3.5 font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                                    formData.type === "income"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                            >
                                {submitting
                                    ? "Adding transaction..."
                                    : `Add ${formData.type === "income" ? "Income" : "Expense"}`}
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
                            Filter by date, category, or transaction type.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-sm font-medium text-slate-700">
                            Date

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(event) => setDateFilter(event.target.value)}
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Category

                            <select
                                value={categoryFilter}
                                onChange={(event) => setCategoryFilter(event.target.value)}
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="all">All categories</option>

                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-sm font-medium text-slate-700">
                            Transaction type

                            <select
                                value={typeFilter}
                                onChange={(event) => setTypeFilter(event.target.value)}
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="all">Income and expenses</option>
                                <option value="income">Income only</option>
                                <option value="expense">Expenses only</option>
                            </select>
                        </label>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                </section>

                {/* Recent transactions */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-bold text-slate-900">
                            Recent transactions
                        </h2>

                        <p className="text-sm text-slate-500">
                            {filteredTransactions.length} of {transactions.length} transactions
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
                            {filteredTransactions.map((transaction, index) => (
                                <TransactionRow
                                    key={transaction._id || `${transaction.title}-${index}`}
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
