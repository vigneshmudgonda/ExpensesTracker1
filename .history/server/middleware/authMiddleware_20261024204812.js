const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    try{
        const decoded = 
    }catch(err){
        res.status(401).json({message: "Please login to access this resource"});
    }
}