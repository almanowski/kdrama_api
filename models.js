const mongoose = require('mongoose');

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

let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavDramas: [{type: mongoose.Schema.Types.ObjectId, ref: 'KDrama'}]
});

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
