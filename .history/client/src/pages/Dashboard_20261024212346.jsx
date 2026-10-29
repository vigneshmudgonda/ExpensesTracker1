import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <main className="dashboard">
            <header>
                <h1>Expenses Tracker</h1>
                <button onClick={logout}>Logout</button>
            </header>

            <section className="welcome-card">
                <h2>Welcome, {user?.name}!</h2>
                <p>You are logged in successfully.</p>
                <p>Email: {user?.email}</p>
            </section>
        </main>
    );
}