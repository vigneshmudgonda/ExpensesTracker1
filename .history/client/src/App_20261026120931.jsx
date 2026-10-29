
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Transactions from './pages/Transactions';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <p className="p-6 text-center">Checking login...</p>;
    }

    return user
        ? children
        : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <p className="p-6 text-center">Loading...</p>;
    }

    return user
        ? <Navigate to="/transactions" replace />
        : children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to="/transactions" replace />}
            />

            <Route
                path="/register"
                element={
                    <GuestRoute>
                        <Register />
                    </GuestRoute>
                }
            />

            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />

            <Route
                path="/transactions"
                element={
                    <ProtectedRoute>
                        <Transactions />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Navigate to="/transactions" replace />
                    </ProtectedRoute>
                }
            />

            <Route
                path="*"
                element={<Navigate to="/transactions" replace />}
            />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
