
import {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const api = axios.create({
    baseURL: 'https://expensestracker1.onrender.com',
    withCredentials: true
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/auth/me')
            .then((res) => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    async function login(email, password) {
        const res = await api.post('/auth/login', {
            email,
            password
        });

        setUser(res.data.user);
        return res.data;
    }

    async function register(name, email, password) {
        const res = await api.post('/auth/register', {
            name,
            email,
            password
        });

        return res.data;
    }

    async function logout() {
        try {
            await api.post('/auth/logout');
        } finally {
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
