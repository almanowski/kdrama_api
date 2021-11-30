const express = require('express'),
    morgan = require('morgan'), // Used for logging
    bodyParser = require('body-parser'), // Reads the “body” of HTTP requests
    uuid = require('uuid'); // Generate a unique ID

const app = express();

// Created JSON object to carry kdrama data
let topKoreanDramas = [
    {
        title: 'Guardian: The Lonely and Great God',
        dramaId: 1,
        episode: 16,
        releaseYear: 2016,
        descreption: 'Kim Shin, a decorated military general from the Goryeo...',
        genre: ['fantasy', 'romance'],
        director: ['Lee Eung-Bok'],
        writer: ['Kim Eun-Sook'],
        imgURL: 'https://asianwiki.com/images/b/b2/Goblin-p04.jpg'
    },
    {
        title: 'Oh my Venus',
        dramaId: 2,
        episode: 16,
        releaseYear: 2015,
        descreption: 'Lorem ipsum dolor sit amet, ...',
        genre: ['comedy', 'romance', 'drama'],
        director: ['Kim Hyung-suk'],
        writer: ['Kim Eun-Ji'],
        imgURL: 'https://'
    },
    {
        title: 'W: Two worlds apart',
        dramaId: 3,
        episode: 16,
        releaseYear: 2016,
        descreption: 'Lorem ipsum dolor sit amet, ...',
        genre: ['romance', 'comedy', 'fantasy', 'action'],
        director: ['Jung Dae-Yoon'],
        writer: ['Song Jae-Jung'],
        imgURL: 'https://'
    },
    {
        title: 'Suspicious Partner',
        dramaId: 4,
        episode: 40,
        releaseYear: 2017,
        descreption: 'Lorem ipsum dolor sit amet, ...',
        genre: ['romance', 'comedy', 'legal', 'crime'],
        director: ['Park Sun-Ho'],
        writer: ['Kwon Ki-Young'],
        imgURL: 'https://'
    },
    {
        title: 'Love in the Moonlight',
        dramaId: 5,
        episode: 18,
        releaseYear: 2016,
        descreption: 'Lorem ipsum dolor sit amet, ...',
        genre: ['romance', 'comedy', 'historical'],
        director: ['Kim Sung-Yoon', 'Baek Sang-Hoon'],
        writer: ['Kim Min-jung', 'Im Ye-jin'],
        imgURL: 'https://'
    }
];

// GENERAL
// Logs time, method, url path, response code, numb of charac of res that was sent back
app.use(morgan('common'));

// Allows you to read the “body” of HTTP requests within your request handlers
app.use(bodyParser.json());

// Serves all static files in public folder
app.use(express.static('public'));

// CONTENT
app.get('/', (req, res) => {
    res.send('Welcome to my korean drama app!');
});

// Displays dramas
app.get('/korean-dramas', (req, res) => {
    res.json(topKoreanDramas);
});

// Displays one drama
app.get('/korean-dramas/:title', (req, res) => {
    res.json(topKoreanDramas.find((drama) => {
        return drama.title === req.params.title;
    }));
});

// Displays drama from a certain genre
app.get('/genres/:genre', (req, res) => {
    res.send('Sucesscul GET request - Returning dramas by genre');
});

// Displays one director
app.get('/directors/:name', (req, res) => {
    res.send('Sucesscul GET request - Returning drama director');
});


//USER
// Adds data for a new user
app.post('/users', (req, res) => {
    res.send('Sucesscul POST request -  New user was able to register');
});

// Update the username
app.put('/users/:id', (req, res) => {
    res.send('Sucesscul PUT request - User changes username');
});

//Update the favlist
app.put('/users/:id/favs/:dramaId', (req, res) => {
    res.send('Sucesscul PUT request - User adds a drama to fav list');
});

//Delte drama from the favlist
app.delete('/users/:id/favs/:dramaId', (req, res) => {
    res.send('Sucesscul DELETE - User deletes a drama from fav list');
});

// Delete user
app.delete('/users/:id', (req, res) => {
    res.send('Sucesscul DELETE request - User deregisters');
})

// Error response
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! - No kdramas for you. :(');
});

// Listen to request
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
