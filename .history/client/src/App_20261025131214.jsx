import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <p className="loading">Checking login...</p>;

    return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <p className="loading">Loading...</p>;

    return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
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
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route
    path="/transactions"
    element={
        <ProtectedRoute>
            <Transactions />
        </ProtectedRoute>
    }
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