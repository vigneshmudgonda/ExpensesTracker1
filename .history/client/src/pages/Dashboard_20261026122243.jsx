
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 sm:px-8">
            <header className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Expenses Tracker
                </h1>

                <button
                    onClick={logout}
                    className="rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white shadow-sm transition duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                >
                    Logout
                </button>
            </header>

            <section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg sm:p-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                    {user?.name?.charAt(0)?.toUpperCase()}
                </div>

                <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                    Welcome, {user?.name}!
                </h2>

                <p className="mb-6 text-gray-500">
                    You are logged in successfully.
                </p>

                <div className="rounded-xl bg-gray-50 p-5 ring-1 ring-gray-200">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">
                        Account Information
                    </p>

                    <p className="break-all text-base text-gray-800">
                        <span className="font-semibold">Email:</span> {user?.email}
                    </p>
                </div>
            </section>
        </main>
    );
}
