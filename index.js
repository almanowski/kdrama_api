const express = require('express'),
    morgan = require('morgan'), // Used for logging
    bodyParser = require('body-parser'),  // Reads the “body” of HTTP requests
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    cors = require('cors');

const { check, validationResult } = require('express-validator');

const KDramas= Models.KDrama,
    Users = Models.User,
    Genres = Models.Genre;

const app = express();

// Conect to DB
mongoose.connect(process.env.CONNECTION_URI,
    {useNewUrlParser: true, useUnifiedTopology: true});

// Allows you to read the “body” of HTTP requests within your request handlers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Logs time, method, url path, response code, numb of charac of res that was sent back
app.use(morgan('common'));

// Serves all static files in public folder
app.use(express.static('public'));

// Allows all domains to make a request to the API
let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234']

app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){// If a specifig origin isn't found on the list of origins
            let message ='The CORS policy for this application doesn\'t allow access from origin ' + origin;
            return callback(new Error(message ), false);
        }
        return callback(null, true);
    }   
}));

// Authentication
let auth = require('./auth.js')(app);

const passport = require('passport');
require('./passport.js');
//app.use(passport.initialize());


// CONTENT
app.get('/', (req, res) => {
    res.send('Welcome to my korean drama app!');
});

// Displays dramas
app.get('/korean-dramas', passport.authenticate('jwt', {session: false}),
(req, res) => {
    KDramas.find()
    .populate('Genre', 'Name')
    .then((kDramas) => {
        res.status(201).json(kDramas);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Displays one drama
app.get('/korean-dramas/:title', passport.authenticate('jwt', {session: false}),
(req, res) => {
    KDramas.findOne({Title: req.params.title})
    .populate('Genre', 'Name')
    .then((kDramas) => {
        res.status(201).json(kDramas);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Displays dramas
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

// Displays drama from a certain genre
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

// Displays one director
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

// Get single USer
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

// Update the username
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

//Update the favlist
app.post('/users/:Username/favs/:dramaId', passport.authenticate('jwt', {session: false}),
(req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username},
    {$push:
        {FavDramas: req.params.dramaId}
    },
    {new: true}, //This line makes sure that the updated document is returend
    (err, updatedUser) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

//Delte drama from the favlist
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

// Delete user
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
