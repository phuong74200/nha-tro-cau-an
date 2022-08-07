require('dotenv').config();

const jwt = require('jsonwebtoken');

const privateKey = process.env.JWT_KEY;

const sign = (data = {}) => {
    return new Promise((resolve, reject) => {
        jwt.sign({ data: data, }, privateKey, { expiresIn: '1d' }, function (err, token) {
            if (err)
                return reject(err);
            resolve(token);
        });
    })
}

const verify = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, privateKey, function (err, decoded) {
            if (err)
                return reject(err);
            resolve(decoded);
        });
    })
}

module.exports = {
    sign,
    verify
}