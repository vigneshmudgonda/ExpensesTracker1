
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Link } from "react-router-dom";

const CHART_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const getTransactionDate = (transaction) =>
  transaction.date || transaction.createdAt;

export default function Dashboard() {
  const auth = useAuth();

  const username =
    auth?.user?.username ||
    auth?.user?.name ||
    auth?.username ||
    "there";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch transactions from the backend
  const fetchTransactions = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/transactions");

      const data = response.data;

      const transactionList = Array.isArray(data)
        ? data
        : Array.isArray(data?.transactions)
          ? data.transactions
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setTransactions(transactionList);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load transactions. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Refresh dashboard after a transaction is added
  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchTransactions();
    };

    window.addEventListener(
      "transactions:updated",
      handleTransactionUpdate
    );

    return () => {
      window.removeEventListener(
        "transactions:updated",
        handleTransactionUpdate
      );
    };
  }, [fetchTransactions]);

  // Logout
  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await api.post("/auth/logout");

      toast.success("Logged out successfully!");

      window.location.replace("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Logout failed. Please try again."
      );
      setLoggingOut(false);
    }
  };

  // Available categories
  const categories = useMemo(() => {
    return [
      ...new Set(
        transactions
          .map((transaction) => transaction.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionType = String(
        transaction.type || ""
      ).toLowerCase();

      if (
        typeFilter !== "all" &&
        transactionType !== typeFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        transaction.category !== categoryFilter
      ) {
        return false;
      }

      const rawDate = getTransactionDate(transaction);

      if (startDate) {
        if (!rawDate) return false;

        const dateValue = new Date(rawDate);
        const start = new Date(`${startDate}T00:00:00`);

        if (dateValue < start) return false;
      }

      if (endDate) {
        if (!rawDate) return false;

        const dateValue = new Date(rawDate);
        const end = new Date(`${endDate}T23:59:59.999`);

        if (dateValue > end) return false;
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    startDate,
    endDate,
  ]);

  // Summary cards use the filtered transactions
  const summary = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;
      const type = String(transaction.type || "").toLowerCase();

      if (type === "income") {
        income += amount;
      } else if (type === "expense") {
        expenses += amount;
      }
    });

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [filteredTransactions]);

  // Pie chart: expenses by category
  const categoryData = useMemo(() => {
    const totals = {};

    filteredTransactions.forEach((transaction) => {
      if (
        String(transaction.type || "").toLowerCase() !== "expense"
      ) {
        return;
      }

      const category = transaction.category || "Other";
      totals[category] =
        (totals[category] || 0) +
        (Number(transaction.amount) || 0);
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredTransactions]);

  // Bar chart: current and previous five months
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        key: `${monthDate.getFullYear()}-${String(
          monthDate.getMonth() + 1
        ).padStart(2, "0")}`,
        month: monthDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        income: 0,
        expenses: 0,
      });
    }

    const monthMap = new Map(
      months.map((month) => [month.key, month])
    );

    filteredTransactions.forEach((transaction) => {
      const rawDate = getTransactionDate(transaction);

      if (!rawDate) return;

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const month = monthMap.get(key);

      if (!month) return;

      const amount = Number(transaction.amount) || 0;
      const type = String(transaction.type || "").toLowerCase();

      if (type === "income") {
        month.income += amount;
      } else if (type === "expense") {
        month.expenses += amount;
      }
    });

    return months;
  }, [filteredTransactions]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => {
        const dateA = new Date(getTransactionDate(a) || 0);
        const dateB = new Date(getTransactionDate(b) || 0);

        return dateB - dateA;
      })
      .slice(0, 10);
  }, [filteredTransactions]);

  const resetFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-indigo-600">
              Expense Tracker
            </h2>
            <p className="text-xs text-gray-500">
              Manage your money smarter
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:block">
              Welcome, {username}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <span aria-hidden="true">↪</span>
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
            
          </div>
          
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Heading and action buttons */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Here is an overview of your finances.
            </p>
          </div>

       
<div className="flex items-center">
  <button
    type="button"
    onClick={() =>
      window.location.assign("/add-transaction")
    }
    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
  >
    <span className="text-xl">+</span>
    Add Transaction
  </button>
</div>

        </div>

        {/* Filters */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Filter Transactions
            </h2>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Reset filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="typeFilter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Transaction type
              </label>

              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="categoryFilter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category
              </label>

              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                From date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                To date
              </label>

              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Error state */}
        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchTransactions}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title="Total Income"
            amount={summary.income}
            symbol="+"
            color="green"
            loading={loading}
          />

          <SummaryCard
            title="Total Expenses"
            amount={summary.expenses}
            symbol="−"
            color="red"
            loading={loading}
          />

          <SummaryCard
            title="Balance"
            amount={summary.balance}
            symbol="₹"
            color="indigo"
            loading={loading}
          />
        </section>

        {/* Charts */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Expense pie chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Expenses by Category
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              See where your money goes.
            </p>

            <div className="mt-5 h-72">
              {loading ? (
                <ChartLoading />
              ) : categoryData.length === 0 ? (
                <ChartEmpty message="No expense data available for these filters." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            CHART_COLORS[
                              index % CHART_COLORS.length
                            ]
                          }
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

          {/* Monthly bar chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Monthly Trends
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Income versus expenses over the last six months.
            </p>

            <div className="mt-5 h-72">
              {loading ? (
                <ChartLoading />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 10,
                      right: 5,
                      left: 5,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="month" fontSize={12} />

                    <YAxis
                      width={75}
                      fontSize={11}
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
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Recent transactions */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recent Transactions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Showing up to 10 transactions.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchTransactions}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl">
                ₹
              </div>

              <h3 className="font-semibold text-gray-900">
                No transactions found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add an income or expense to get started, or adjust
                your filters.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.assign(
                    "/add-transaction?type=expense"
                  )
                }
                className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add your first transaction
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Transaction
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Type
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {recentTransactions.map((transaction, index) => {
                    const isIncome =
                      String(transaction.type || "").toLowerCase() ===
                      "income";

                    return (
                      <tr
                        key={
                          transaction._id ||
                          transaction.id ||
                          `${transaction.title}-${index}`
                        }
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-medium text-gray-900">
                            {transaction.title || "Untitled"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {transaction.category || "Other"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {formatDate(getTransactionDate(transaction))}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isIncome
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isIncome ? "Income" : "Expense"}
                          </span>
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right text-sm font-semibold ${
                            isIncome
                              ? "text-green-600"
                              : "text-red-600"
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
      </main>
    </div>
  );
}

// Summary card component
function SummaryCard({
  title,
  amount,
  symbol,
  color,
  loading,
}) {
  const styles = {
    green: {
      icon: "bg-green-100 text-green-700",
      amount: "text-green-700",
      border: "border-green-100",
    },
    red: {
      icon: "bg-red-100 text-red-700",
      amount: "text-red-700",
      border: "border-red-100",
    },
    indigo: {
      icon: "bg-indigo-100 text-indigo-700",
      amount: "text-indigo-700",
      border: "border-indigo-100",
    },
  };

  const style = styles[color] || styles.indigo;

  return (
    <div
      className={`rounded-2xl border ${style.border} bg-white p-5 shadow-sm sm:p-6`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold ${style.icon}`}
        >
          {symbol}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 h-8 w-36 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className={`mt-5 break-words text-2xl font-bold ${style.amount}`}>
          {formatCurrency(amount)}
        </p>
      )}
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-gray-500">
        Loading chart...
      </div>
    </div>
  );
}

function ChartEmpty({ message }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
