
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../context/AuthContext";

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

function SummaryCard({ title, amount, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-3 text-2xl font-bold ${color}`}>
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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
        throw new Error("Unexpected transactions response from server.");
      }

      setTransactions(transactionList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load transactions. Please log in again if your session expired."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          transactions.map((item) => item.category).filter(Boolean)
        ),
      ].sort(),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesDate =
        !dateFilter ||
        (item.date &&
          !Number.isNaN(new Date(item.date).getTime()) &&
          new Date(item.date).toISOString().slice(0, 10) === dateFilter);

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesType = typeFilter === "all" || item.type === typeFilter;

      return matchesDate && matchesCategory && matchesType;
    });
  }, [transactions, dateFilter, categoryFilter, typeFilter]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (result, item) => {
        const amount = Number(item.amount) || 0;

        if (item.type === "income") result.income += amount;
        if (item.type === "expense") result.expenses += amount;

        return result;
      },
      { income: 0, expenses: 0 }
    );
  }, [filteredTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setError("");
    setDeletingId(id);

    try {
      await api.delete(`/transactions/${id}`);

      setTransactions((current) =>
        current.filter((item) => item._id !== id)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete transaction."
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
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

          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

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
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                className="w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>

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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ₹
              </div>
              <h3 className="mt-4 font-bold text-slate-800">
                No transactions found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your filters or add a transaction first.
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
