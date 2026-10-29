
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

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

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const CHART_COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMonthKey(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getLastSixMonths() {
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    months.push({
      key: getMonthKey(date),
      month: date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      income: 0,
      expense: 0,
    });
  }

  return months;
}

function getDate(transaction) {
  return transaction.date || transaction.createdAt || null;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch transactions from your Express backend
  const fetchTransactions = useCallback(async (showToast = false) => {
    setRefreshing(true);

    try {
      const response = await api.get("/transactions");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.transactions ??
          response.data?.data ??
          [];

      if (!Array.isArray(data)) {
        throw new Error("Invalid transactions response.");
      }

      setTransactions(data);

      if (showToast) {
        toast.success("Dashboard updated successfully!");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load transactions. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Get the logged-in user's name
  const username =
    user?.username ||
    user?.name ||
    user?.fullName ||
    user?.email?.split("@")[0] ||
    "there";

  // Calculate totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        income += amount;
      } else if (transaction.type === "expense") {
        expense += amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  // Pie chart: expenses by category
  const categoryData = useMemo(() => {
    const categories = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const category = transaction.category || "Other";
      const amount = Number(transaction.amount) || 0;

      categories[category] = (categories[category] || 0) + amount;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  // Bar chart: income and expenses for the last six months
  const monthlyData = useMemo(() => {
    const months = getLastSixMonths();
    const monthMap = new Map(
      months.map((month) => [month.key, month])
    );

    transactions.forEach((transaction) => {
      const month = monthMap.get(getMonthKey(getDate(transaction)));

      if (!month) return;

      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        month.income += amount;
      } else if (transaction.type === "expense") {
        month.expense += amount;
      }
    });

    return months;
  }, [transactions]);

  // Latest five transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA = new Date(getDate(a) || 0).getTime();
        const dateB = new Date(getDate(b) || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [transactions]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Greeting and refresh button */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Personal Finance
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome back, {username}!
            </h1>

            <p className="mt-2 text-slate-500">
              Here's an overview of your money.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </section>

        {/* Balance, income and expense cards */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Total Balance"
            amount={totals.balance}
            description="Income minus expenses"
            color="indigo"
            symbol="₹"
          />

          <SummaryCard
            title="Total Income"
            amount={totals.income}
            description="Total money received"
            color="emerald"
            symbol="+"
          />

          <SummaryCard
            title="Total Expenses"
            amount={totals.expense}
            description="Total money spent"
            color="rose"
            symbol="−"
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Expense category pie chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Expenses by Category
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See where your money goes.
            </p>

            {loading ? (
              <ChartLoading />
            ) : categoryData.length === 0 ? (
              <EmptyState message="No expenses yet. Add an expense to view this chart." />
            ) : (
              <div className="mt-4 h-72 w-full">
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
                      {categoryData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={
                            CHART_COLORS[index % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => currency.format(value)}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Monthly income versus expense bar chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Monthly Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare your income and expenses over six months.
            </p>

            {loading ? (
              <ChartLoading />
            ) : (
              <div className="mt-4 h-72 w-full">
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

                    <XAxis dataKey="month" />

                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `₹${value / 1000}k`
                          : `₹${value}`
                      }
                    />

                    <Tooltip
                      formatter={(value) => currency.format(value)}
                    />

                    <Legend />

                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#10b981"
                      radius={[5, 5, 0, 0]}
                    />

                    <Bar
                      dataKey="expense"
                      name="Expenses"
                      fill="#f43f5e"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Recent transactions table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Transactions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your five latest transactions.
              </p>
            </div>

            <Link
              to="/transactions"
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <EmptyState message="No transactions yet. Add your first transaction to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Transaction
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Category
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((transaction, index) => {
                    const isIncome = transaction.type === "income";

                    return (
                      <tr
                        key={
                          transaction._id ||
                          transaction.id ||
                          `${transaction.title}-${index}`
                        }
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {transaction.title || "Untitled"}
                          </p>

                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {transaction.type}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.category || "Other"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(getDate(transaction))}
                        </td>

                        <td
                          className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
                            isIncome
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : "−"}
                          {currency.format(
                            Number(transaction.amount) || 0
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick action */}
        <div className="flex justify-center pb-4">
          <Link
            to="/transactions"
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Manage Transactions
          </Link>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  amount,
  description,
  color,
  symbol,
}) {
  const styles = {
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      border: "border-l-indigo-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      border: "border-l-emerald-500",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600",
      border: "border-l-rose-500",
    },
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 border-l-4 ${styles[color].border} bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
            {currency.format(amount)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${styles[color].icon}`}
        >
          {symbol}
        </div>
      </div>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-72 animate-pulse items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p className="text-sm text-slate-500">Loading chart...</p>
      </div>
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
