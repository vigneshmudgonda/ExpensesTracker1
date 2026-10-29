
import { useState } from "react";
import { api } from "../context/AuthContext";
import toast from "react-hot-toast";

const categories = {
  expense: [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Health",
    "Education",
    "Entertainment",
    "Other",
  ],
  income: [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Gift",
    "Other",
  ],
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AddTransaction() {
  const [type, setType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(getTodayDate());
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(categories[newType][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a transaction title.");
      return;
    }

    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    if (!category || !date) {
      toast.error("Please select a category and date.");
      return;
    }

    const transactionData = {
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
    };

    try {
      setLoading(true);

      // Send the transaction to your backend.
      await api.post("/transactions", transactionData);

      toast.success(
        `${type === "income" ? "Income" : "Expense"} added successfully!`
      );

      // Notify the dashboard to fetch updated transactions.
      window.dispatchEvent(new Event("transactions:updated"));

      // Reset the form after a successful save.
      setTitle("");
      setAmount("");
      setType("expense");
      setCategory("Food");
      setDate(getTodayDate());
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save transaction. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Money Manager
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Add Transaction
          </h1>

          <p className="mt-2 text-gray-500">
            Record your income and expenses to track your money.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction type */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Transaction Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  aria-pressed={type === "expense"}
                  className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                    type === "expense"
                      ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="mb-1 block text-xl">↗</span>
                  Add Expense
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  aria-pressed={type === "income"}
                  className={`rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                    type === "income"
                      ? "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-100"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="mb-1 block text-xl">↙</span>
                  Add Income
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "income"
                    ? "e.g. Monthly salary"
                    : "e.g. Grocery shopping"
                }
                maxLength={100}
                required
                className={inputClass}
              />
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Amount (₹)
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>

                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className={inputClass}
              >
                {categories[type].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Transaction Date
              </label>

              <input
                id="date"
                type="date"
                value={date}
                max={getTodayDate()}
                onChange={(e) => setDate(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Preview */}
            <div
              className={`rounded-xl p-4 ${
                type === "income"
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <p className="text-sm text-gray-600">
                {type === "income" ? "Income amount" : "Expense amount"}
              </p>

              <p
                className={`mt-1 text-2xl font-bold ${
                  type === "income"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {type === "income" ? "+" : "−"}₹
                {Number(amount || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-5 py-3.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                type === "income"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading
                ? "Saving transaction..."
                : `Save ${type === "income" ? "Income" : "Expense"}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
