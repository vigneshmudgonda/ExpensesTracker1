const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port =process.env.PORT || 3000;
require('./db');

app.get('/', (req,res) => {
    res.send('Hello, World!');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

