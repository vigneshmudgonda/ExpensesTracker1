
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

import { api, useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Currency formatter for Indian Rupees
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0);
}

// Format transaction date
function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTransactionDate(transaction) {
  return transaction.date || transaction.createdAt || null;
}

// Convert a date into local YYYY-MM-DD format
function getLocalDateString(value) {
  if (!value) return "";

  // Avoid timezone shifting for date-only strings from the API.
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Unable to load transactions. Please try again."
  );
}

const chartPalette = [
  "#4f46e5",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function Dashboard() {
  const auth = useAuth();

  const username =
    auth?.user?.username ||
    auth?.user?.name ||
    auth?.username ||
    "there";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Transaction filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Fetch transactions from the backend
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/transactions");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.transactions ??
          response.data?.data ??
          [];

      if (!Array.isArray(data)) {
        throw new Error(
          "The server returned an invalid transaction list."
        );
      }

      setTransactions(data);
    } catch (err) {
      console.error("Fetch transactions error:", err);

      const message = getErrorMessage(err);

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transactions when the dashboard opens
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Refresh when another component adds, edits, or deletes a transaction.
  useEffect(() => {
    const handleTransactionsUpdated = () => {
      fetchTransactions();
    };

    window.addEventListener(
      "transactions:updated",
      handleTransactionsUpdated
    );

    return () => {
      window.removeEventListener(
        "transactions:updated",
        handleTransactionsUpdated
      );
    };
  }, [fetchTransactions]);

  // Get available categories
  const categories = useMemo(() => {
    return [
      ...new Set(
        transactions
          .map((transaction) => transaction.category?.trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  // Apply date, category, and transaction-type filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = getTransactionDate(transaction);

      const localDate = transactionDate
        ? getLocalDateString(transactionDate)
        : "";

      const matchesStartDate =
        !startDate || (localDate && localDate >= startDate);

      const matchesEndDate =
        !endDate || (localDate && localDate <= endDate);

      const matchesCategory =
        selectedCategory === "all" ||
        transaction.category === selectedCategory;

      const matchesType =
        selectedType === "all" ||
        transaction.type === selectedType;

      return (
        matchesStartDate &&
        matchesEndDate &&
        matchesCategory &&
        matchesType
      );
    });
  }, [
    transactions,
    startDate,
    endDate,
    selectedCategory,
    selectedType,
  ]);

  // Calculate balance, income, and expenses
  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        income += amount;
      } else if (transaction.type === "expense") {
        expenses += amount;
      }
    });

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [filteredTransactions]);

  // Pie chart data: expense totals by category
  const categoryData = useMemo(() => {
    const totals = {};

    filteredTransactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const category = transaction.category?.trim() || "Other";
      const amount = Number(transaction.amount) || 0;

      totals[category] = (totals[category] || 0) + amount;
    });

    return Object.entries(totals).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [filteredTransactions]);

  // Bar chart data: income and expenses grouped by month
  const monthlyData = useMemo(() => {
    const months = {};

    filteredTransactions.forEach((transaction) => {
      const dateValue = getTransactionDate(transaction);

      if (!dateValue) return;

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;

      if (!months[key]) {
        months[key] = {
          month: new Intl.DateTimeFormat("en-IN", {
            month: "short",
            year: "numeric",
          }).format(date),
          income: 0,
          expenses: 0,
          sortKey: key,
        };
      }

      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        months[key].income += amount;
      } else if (transaction.type === "expense") {
        months[key].expenses += amount;
      }
    });

    return Object.values(months)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...item }) => item);
  }, [filteredTransactions]);

  const invalidDateRange =
    startDate !== "" &&
    endDate !== "" &&
    startDate > endDate;

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedCategory("all");
    setSelectedType("all");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Welcome banner */}
        <section className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-100">
            Personal Finance
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome back, {username}!
          </h1>

          <p className="mt-2 text-sm text-indigo-100">
            Track your income, expenses, and monthly spending.
          </p>
        </section>

        {/* Page heading and refresh button */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Overview
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your financial summary at a glance.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh Transactions"}
          </button>
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Balance"
            amount={summary.balance}
            color="indigo"
          />

          <SummaryCard
            title="Income"
            amount={summary.income}
            color="emerald"
          />

          <SummaryCard
            title="Expenses"
            amount={summary.expenses}
            color="rose"
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Category-wise expense pie chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Expenses by Category
            </h2>

            <p className="mb-4 mt-1 text-sm text-slate-500">
              See where your money is going.
            </p>

            <div className="h-80">
              {loading ? (
                <ChartLoading />
              ) : categoryData.length === 0 ? (
                <ChartEmpty message="No expense data available for these filters." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartPalette[index % chartPalette.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Monthly income and expenses bar chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Monthly Trends
            </h2>

            <p className="mb-4 mt-1 text-sm text-slate-500">
              Compare income and expenses month by month.
            </p>

            <div className="h-80">
              {loading ? (
                <ChartLoading />
              ) : monthlyData.length === 0 ? (
                <ChartEmpty message="No monthly transaction data available." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      width={75}
                      tick={{ fontSize: 12 }}
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
                    />

                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#f43f5e"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Transaction filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Filter Transactions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Filter by date, category, or type.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:self-auto"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Start date */}
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                From Date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* End date */}
            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                To Date
              </label>

              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category
              </label>

              <select
                id="category"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction type */}
            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Transaction Type
              </label>

              <select
                id="type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>

          {invalidDateRange && (
            <p className="mt-4 text-sm font-medium text-rose-600">
              The start date must be on or before the end date.
            </p>
          )}
        </section>

        {/* Transaction list */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading your transactions..."
                : `${invalidDateRange ? 0 : filteredTransactions.length} transaction(s) found`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="font-medium text-rose-600">{error}</p>

              <button
                type="button"
                onClick={fetchTransactions}
                className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : invalidDateRange ? (
            <EmptyState message="Choose a valid date range to view transactions." />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState message="No transactions match your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Title</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((transaction, index) => {
                    const isIncome = transaction.type === "income";

                    return (
                      <tr
                        key={
                          transaction._id ||
                          transaction.id ||
                          `${transaction.title}-${index}`
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {transaction.title || "Untitled"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.category || "Other"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(getTransactionDate(transaction))}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              isIncome
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>

                        <td
                          className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
                            isIncome
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "−"}
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// Summary card component
function SummaryCard({ title, amount, color }) {
  const styles = {
    indigo: {
      border: "border-l-indigo-500",
      badge: "bg-indigo-50 text-indigo-700",
    },
    emerald: {
      border: "border-l-emerald-500",
      badge: "bg-emerald-50 text-emerald-700",
    },
    rose: {
      border: "border-l-rose-500",
      badge: "bg-rose-50 text-rose-700",
    },
  };

  const style = styles[color] || styles.indigo;

  return (
    <div
      className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${style.border}`}
    >
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {formatCurrency(amount)}
      </p>

      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
      >
        {title === "Income"
          ? "Money received"
          : title === "Expenses"
            ? "Money spent"
            : "Net balance"}
      </span>
    </div>
  );
}

// Chart loading placeholder
function ChartLoading() {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      <div className="mx-auto h-3 w-1/2 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

// Empty state component
function ChartEmpty({ message }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
