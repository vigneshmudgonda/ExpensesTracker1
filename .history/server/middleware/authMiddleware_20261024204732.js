const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    try{

    }catch(err){
        res.status(401).json({message: "Not Authorized"})
    }
}