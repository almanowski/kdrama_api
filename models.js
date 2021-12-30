const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let dramaSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: [{
        Name: String,
        Description: String
    }],
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

let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavDramas: [{type: mongoose.Schema.Types.ObjectId, ref: 'KDrama'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
};

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
