
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  const name = user?.name || "User";
  const email = user?.email || "Email not available";

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white sm:px-8">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="mt-2 text-sm text-indigo-100">
              View your account information.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-700">
                {initial}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{email}</p>
              </div>
            </div>

            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Account Information
            </h3>

            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="mt-1 font-medium text-gray-900">
                  {name}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="mt-1 break-all font-medium text-gray-900">
                  {email}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="mt-1 font-medium text-green-700">
                  Logged In
                </p>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
