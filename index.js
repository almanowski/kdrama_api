/** 
 * @fileOverview In this file the endpoints for the API are defined. 
 * @see <a href="https://mykdrama.herokuapp.com/documentation.html">Table of all endpoints and data formats</a>
*/
/**
 * @module index
 */

// Integrated Mongoose into the REST API
const express = require('express'),
    morgan = require('morgan'), // Used for logging
    bodyParser = require('body-parser'),  // Reads the “body” of HTTP requests
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    cors = require('cors');

const { check, validationResult } = require('express-validator');

// reference to the models
const KDramas= Models.KDrama,
    Users = Models.User,
    Genres = Models.Genre;

const app = express();

// Connect to DB
mongoose.connect(process.env.CONNECTION_URI,
    {useNewUrlParser: true, useUnifiedTopology: true});

// Allows you to read the “body” of HTTP requests within your request handlers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Logs time, method, url path, response code, numb of charac of res that was sent back
app.use(morgan('common'));

// Serves all static files in public folder
app.use(express.static('public'));

// Allows listed domains to make a request to the API
let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'https://mydrama.netlify.app', 'http://localhost:4200', 'https://almanowski.github.io']

app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){ 
            // If a specific origin isn't found on the list of origins
            let message ='The CORS policy for this application doesn\'t allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }   
}));

// Import authentication endpoints
let auth = require('./auth.js')(app);

// Passport is used fo authorization 
const passport = require('passport');
require('./passport.js');


// CONTENT
/** 
* @function
* @memberof module:index
* @summary GET Returns the landing page ('/') endpoint
* @method GET
* @param {URL} - Endpoint to fetch welcome message
* @returns {string} - Welcome message
*/
app.get('/', (req, res) => {
    res.send('Welcome to my korean drama app!');
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Returns list of dramas
 * @method GET 
 * @param {URL} - Endpoint to fetch dramas "/korean-dramas"
 * @returns {json-object} - Returns a list of all dramas
 */
app.get('/korean-dramas', passport.authenticate('jwt', {session: false}),
(req, res) => {
    KDramas.find()
    .populate('Genre')
    .then((kDramas) => {
        res.status(201).json(kDramas);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Return all data about a single drama, by title
 * @method GET 
 * @param {URL} - Endpoint to fetch one drama "/korean-dramas"
 * @param {string} - Title to identify the drama "/:Title"
 * @returns {json-object} - Returns data about a single drama
 */
app.get('/korean-dramas/:title', passport.authenticate('jwt', {session: false}),
(req, res) => {
    KDramas.findOne({Title: req.params.title})
    .populate('Genre')
    .then((kDramas) => {
        res.status(201).json(kDramas);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Return list of genres
 * @method GET 
 * @param {URL} - Endpoint to fetch genres "/genres"
 * @returns {json-object} - Returns a list of all genres
 */
app.get('/genres', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Genres.find()
    .then((genres) => {
        res.status(201).json(genres);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Return a single genre by name
 * @method GET 
 * @param {URL} - Endpoint to fetch one genre "/genres"
 * @param {string} - Name to identify the genre "/:name"
 * @returns {json-object} - Returns data about a single genre
 */
app.get('/genres/:name', passport.authenticate('jwt', {session: false}),
(req, res) => {
  Genres.findOne({Name: req.params.name})
  .then((genres) => {
      res.status(201).json(genres);
  })
  .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
  });
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Return a single director by name
 * @method GET 
 * @param {URL} - Endpoint to fetch one genre "/directors"
 * @param {string} - Name to identify the genre "/:name"
 * @returns {json-object} - Returns data about a single director
 */
app.get('/directors/:name', passport.authenticate('jwt', {session: false}),
(req, res) => {
  KDramas.findOne({'Director.Name': req.params.name},
  {'Director.Name': 1, 'Director.Bio':1, 'Director.Birth':1, _id:0})
  .then((kDramas) => {
      res.status(201).json(kDramas);
  })
  .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
  });
});


//USER
/** 
 * @function
 * @memberof module:index
 * @summary POST Allow new user to register
 * @method POST
 * @param {URL} - Endpoint to post users "/users"
 * @returns {string} - Returns success/error message
 * @returns {json-object} - If successful: Returns an object holding the new user data
 */
app.post('/users',
    [
        check('Username', 'Username is required').isLength({min: 5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {
        // Check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({Username: req.body.Username})
            .then((user) => {
              if (user) {
                  return res.status(400).send(req.body.Username + 'already exists');
              } else {
                  Users
                      .create({
                          Username: req.body.Username,
                          Password: hashedPassword,
                          Email: req.body.Email,
                          Birthday: req.body.Birthday
                      })
                      .then((user) =>{res.status(201).json(user)})
                  .catch((error) => {
                      console.error(error);
                      res.status(500).send('Error: ' + error);
                  })
              }
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Return a single user by username
 * @method GET
 * @param {URL} - Endpoint to post users "/users"
 * @param {string} - Username to identify the user "/:Username"
 * @returns {json-object} - Returns data about a single user
 */
app.get('/users/:Username', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Users.findOne({Username: req.params.Username})
    .then((user) => {
        res.status(201).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/** 
 * @function
 * @memberof module:index
 * @summary GET Return a favorite drama list from one user
 * @method GET
 * @param {URL} - Endpoint to to fetch the user "/users"
 * @param {string} - Username to identify the user "/:Username"
 * @param {URL} - Endpoint to to fetch the favorite dramas"/favs"
 * @returns {json-object} - Returns list of favorite dramas
 */
app.get('/users/:Username/favs', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Users.findOne({Username: req.params.Username},
    {_id:0, 'FavDramas':1})
    .then((user) => {
        res.status(201).json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/** 
 * @function
 * @memberof module:index
 * @summary PUT Allow users to update their user info
 * @method PUT
 * @param {URL} - Endpoint to put user "/users"
 * @param {string} - Username to identify the user "/:Username"
 * @returns {string} - Returns success/error message
 * @returns {json-object} - If successful: Returns an object holding the updated user data
 */
app.put('/users/:Username', passport.authenticate('jwt', {session: false}),
    [
        check('Username', 'Username is required').isLength({min: 5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {
      // Check the validation object for errors
      let errors = validationResult(req);

      if (!errors.isEmpty()) {
          return res.status(422).json({errors: errors.array() });
      }

      let hashedPassword = Users.hashPassword(req.body.Password);

      Users.findOneAndUpdate({Username: req.params.Username},
      {$set:
         {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
          }
        },
        {new: true}, //This line makes sure that the updated document is returned
        (err, updatedUser) => {
            if(err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

/**
 * @function
 * @memberof module:index
 * @summary POST Allow users to add a drama as favorite drama
 * @method POST
 * @param {URL} - Endpoint to fetch the user "/users"
 * @param {string} - Username to identify the user "/:Username"
 * @param {URL} - Endpoint to fetch the favorite dramas"/favs"
 * @param {string} - Endpoint to post the drama as favorite"/:dramaId"
 * @returns {string} - Returns success/error message
 * @returns {json-object} - If successful: Returns an object holding the updated data
 */
app.post('/users/:Username/favs/:dramaId', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username},
    {$push:
        {FavDramas: req.params.dramaId}
    },
    {new: true}, //This line makes sure that the updated document is returned
    (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

/** 
 * @function
 * @memberof module:index
 * @summary DELETE Allow users to remove a drama from their favorites
 * @method DELETE
 * @param {URL} - Endpoint to fetch the user "/users"
 * @param {string} - Username to identify the user "/:Username"
 * @param {URL} - Endpoint to fetch the favorite dramas"/favs"
 * @param {string} - Endpoint to remove the drama from favorites"/:dramaId"
 * @returns {string} - Returns success/error message
 * @returns {json-object} - If successful: Returns an object holding the updated data
 */
app.delete('/users/:Username/favs/:dramaId', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username},
    {$pull:
        {FavDramas: req.params.dramaId}
    },
    {new: true},
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
          res.json(updatedUser);
        }
    });
});;

/** 
 * @function
 * @memberof module:index
 * @summary DELETE Allow existing user to deregister
 * @method DELETE
 * @param {URL} - Endpoint to fetch the user "/users"
 * @param {string} - Username to identify the user "/:Username"
 * @returns {string} - Returns success/error message
 */
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
      .then((user) => {
          if(!user) {
              res.status(400).send(req.params.Username + ' was not found');
          } else {
              res.status(200).send('Your account was deleted.');
          }
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
});

// Error response
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! - No kdramas for you. :(');
});

// Listen to request
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
