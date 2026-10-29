const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
require('./db');

const app = express();
const port =process.env.PORT || 3000;


app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.get('/', (req,res) => {
    res.send('Hello, World!');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

