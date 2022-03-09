/** 
 * @fileOverview In this file the endpoints for the API are defined. 
 * @see <a href="https://mykdrama.herokuapp.com/documentation.html">Table of all endpoints and data formats</a>
*/

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

// Import passport module
const passport = require('passport');
require('./passport.js');


// CONTENT
/** 
* @summary GET request to the landing page ('/') endpoint
* @method GET
* @param {string} URL
* @returns {string} Welcome message
*/
app.get('/', (req, res) => {
    res.send('Welcome to my korean drama app!');
});

/** 
 * @summary GET request to the /korean-dramas endpoint
 * @description Get a list of Korean dramas
 * @method GET 
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object}  A JASON object holding data about all korean dramas
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
 * @summary GET request to the /korean-dramas/[title] endpoint
 * @description Get data about a single drama
 * @method GET 
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JASON object holding data about a single drama, containing a title, episodes, release Year, description, genre, director, image URL
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
 * @summary GET request to the /genres endpoint
 * @description Get a list of genres
 * @method GET 
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JASON object holding data about all genres
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
 * @summary GET request to the /genres/[name] endpoint
 * @description Get data about a genre by name/title (e.g., "Thriller")
 * @method GET 
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object}  A JASON object holding data about a single genre, containing name and description.
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
 * @summary GET request to the /directors/[name] endpoint
 * @description Get data about a director by name
 * @method GET 
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JASON object holding data about a single director, containing name, bio and birth
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
 * @summary POST request to the /users endpoint
 * @description Allow new users to register
 * @method POST
 * @param {Object} object A JSON object holding data about the user to add.
 * @returns {Object} A JSON object holding data about the user that was added, including an ID.
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
 * @summary GET request to the /users/[Username] endpoint
 * @description Allows user to see user information
 * @method GET
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JSON object holding data about the user that was added, including an ID.
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
 * @summary GET request to the /users/[Username]/favs endpoint
 * @description Allows user to see favorite dramas
 * @method GET
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JSON object holding data about the users favorite dramas.
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
 * @summary PUT request to the /users/[Username] endpoint
 * @description Allow users to update their user info (username)
 * @method PUT
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @param {Object} object A JSON object holding data about the user to update.
 * @returns {Object} A JSON object holding data about the user that was updated.
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
 * @summary POST request to the /users/[Username]/favs/[dramaId] endpoint
 * @description Allow users to add a drama to their list of fav
 *  Adding a favorite drama to the array containing the favorites of the user that is called in the endpoint
 * @method POST
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JSON object holding data about the favourite Drama that was added.
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
 * @summary DELETE request to the /users/[Username]/favs/[dramaId] endpoint
 * @description Allow users to remove a drama from their list of favourites
 * @method DELETE
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {Object} A JSON object holding data about the favourite Drama that was deleted.
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
 * @summary DELETE request to the /users/[Username] endpoint
 * @description Allow existing users to deregister
 * @method DELETE
 * @param {authenticationCallback} object  headers {"Authorization" : "Bearer <jwt>"}
 * @returns {String} A text message, indicating that the account has been deleted.
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
