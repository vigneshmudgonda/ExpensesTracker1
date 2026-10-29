const jwt = require('jsonwebtoken');
const

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch(err){
        res.status(401).json({message: "Please login to access this resource"});
    }
}