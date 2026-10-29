const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

function setTokenCookie(res, userId) {
    const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    });
}

function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email
    };
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Enter a valid email address'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email is already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        setTokenCookie(res, user._id.toString());

        return res.status(201).json({
            message: 'Registration successful',
            user: publicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Email is already registered'
            });
        }

        console.error('Registration error:', error.message);
        return res.status(500).json({
            message: 'Unable to register right now'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        setTokenCookie(res, user._id.toString());

        return res.json({
            message: 'Login successful',
            user: publicUser(user)
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({
            message: 'Unable to log in right now'
        });
    }
});

// Get currently logged-in user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            res.clearCookie('token', { path: '/' });
            return res.status(401).json({
                message: 'User no longer exists'
            });
        }

        return res.json({ user: publicUser(user) });
    } catch (error) {
        return res.status(500).json({
            message: 'Unable to fetch user'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    return res.json({ message: 'Logged out successfully' });
});

module.exports = router;