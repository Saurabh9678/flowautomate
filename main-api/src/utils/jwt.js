const jwt = require('jsonwebtoken');

exports.generateToken = (userId, expiry= '1h') => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: expiry });
}
