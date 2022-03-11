/** 
 * @fileOverview In this file, the schemas for the documents held in the kdrama, genre and user collection in MongoDB get implemented.
*/
/**
 * @module models
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


/** 
 * @summary Mongoose schema for the dramas
*/
let dramaSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: [{type: mongoose.Schema.Types.ObjectId, ref: 'Genre'}],
    ReleaseYear: {type: String},
    Episodes: {type: String},
    Director: {
        Name: String,
        Bio: String,
        Birth: String
    },
    Writer: [String],
    ImagePath: String,
    Featured: Boolean
});

/** 
 * @summary Mongoose schema for the users
*/
let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavDramas: [{type: mongoose.Schema.Types.ObjectId, ref: 'KDrama'}]
});

/** 
 * @function
 * @memberof module:models
 * @summary The password gets hashed with bcrypt.
 * @param {string} - The user password. 
 * @returns {string} String containing the hashed password.
*/
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

/** 
 * @function
 * @memberof module:models
 * @summary Validating the entered password by comparing it to the stored password hash
 * @param {string} - The user password. 
 * @returns {Boolean} - Returns true or false
*/
userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
};

/** 
 * @summary Mongoose schema for the genres
*/
let genreSchema = mongoose.Schema({
    Name: {type: String},
    Description: {type: String}
})

let KDrama = mongoose.model('KDrama', dramaSchema);
let User = mongoose.model('User', userSchema);
let Genre = mongoose.model('Genre', genreSchema);

module.exports.KDrama = KDrama;
module.exports.User = User;
module.exports.Genre = Genre;
