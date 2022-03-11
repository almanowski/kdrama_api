/** 
 * @fileOverview In this file, the login endpoint for the API is defined, and a JWT web token gets created.
*/
/**
 * @module auth
 */

const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport'); // Your local passport file

/** 
 * @function
 * @memberof module:auth
 * @summary Generates a JWT web token.
 * @param {object} - An object containing the user data.
 * @returns {String} A JWT web token.
*/
let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // This is the username you’re encoding in the JWT
        expiresIn: '7d', // This specifies that the token will expire in 7 days
        algorithm: 'HS256' // This is the algorithm used to “sign” or encode the values of the JWT
    });
}

/** 
 * @function
 * @memberof module:auth
 * @summary POST Allow user to log in
 * @method POST
 * @param {URL} - Endpoint to post users for login "/login"
 * @returns {string} - Returns success/error message
 * @returns {json-object} - If successful: Returns a jwt token for the user to authorize
 */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right',
                    user: user
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}
