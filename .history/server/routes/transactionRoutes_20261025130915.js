
const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

// POST /transactions - Add a transaction
router.post('/', async (req, res) => {
    try {
        const { title, amount, type, category, date } = req.body;

        if (
            typeof title !== 'string' ||
            !title.trim() ||
            title.trim().length > 100 ||
            typeof category !== 'string' ||
            !category.trim() ||
            category.trim().length > 50
        ) {
            return res.status(400).json({
                message: 'Valid title and category are required'
            });
        }

        if (
            amount === '' ||
            amount === null ||
            amount === undefined ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                message: 'Amount must be a number greater than zero'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                message: 'Type must be income or expense'
            });
        }

        const transactionData = {
            user: req.userId,
            title: title.trim(),
            amount: Number(amount),
            type,
            category: category.trim()
        };

        if (date !== undefined) {
            const parsedDate = new Date(date);

            if (!date || Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    message: 'Please provide a valid date'
                });
            }

            transactionData.date = parsedDate;
        }

        const transaction = await Transaction.create(transactionData);

        return res.status(201).json({
            message: 'Transaction added successfully',
            transaction
        });
    } catch (error) {
        console.error('Create transaction error:', error.message);
        return res.status(500).json({
            message: 'Unable to add transaction'
        });
    }
});

// GET /transactions - List the logged-in user's transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.userId
        }).sort({ date: -1, _id: -1 });

        return res.json({ transactions });
    } catch (error) {
        console.error('Fetch transactions error:', error.message);
        return res.status(500).json({
            message: 'Unable to fetch transactions'
        });
    }
});

// DELETE /transactions/:id - Delete only the owner's transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid transaction ID'
            });
        }

        const transaction = await Transaction.findOneAndDelete({
            _id: id,
            user: req.userId
        });

        if (!transaction) {
            return res.status(404).json({
                message: 'Transaction not found'
            });
        }

        return res.json({
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        console.error('Delete transaction error:', error.message);
        return res.status(500).json({
            message: 'Unable to delete transaction'
        });
    }
});

module.exports = router;
