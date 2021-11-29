const express = require('express'),
    morgan = require('morgan'), // Used for logging
    bodyParser = require('body-parser'), // Reads the “body” of HTTP requests
    uuid = require('uuid'); // Generate a unique ID

const app = express();

// Created JSON object to carry kdrama data
let topKoreanDramas = [
    {
      title: 'Guardian: The Lonely and Great God',
      episode: 16,
      releaseYear: 2016
    },
    {
      title: 'Oh my Venus',
      episode: 16,
      releaseYear: 2015
    },
    {
      title: 'W: Two worlds apart',
      episode: 16,
      releaseYear: 2016
    },
    {
      title: 'Suspicious Partner',
      episode: 40,
      releaseYear: 2017
    },
    {
      title: 'Love in the Moonlight',
      episode: 18,
      releaseYear: 2016
    },
    {
      title: 'Healer',
      episode: 20,
      releaseYear: 2015
    },
    {
      title: 'Who Are You: School 2015',
      episode: 16,
      releaseYear: 2015
    },
    {
      title: 'You are all surrounded',
      episode: 20,
      releaseYear: 2014
    },
    {
      title: 'Lawless Lawyer',
      episode: 16,
      releaseYear: 2018
    },
    {
      title: 'The Tale of Nokdu',
      episode: 32,
      releaseYear: 2019
    },
];

// GENERAL
// Logs time, method, url path, response code, numb of charac of res that was sent back
app.use(morgan('common'));

// Allows you to read the “body” of HTTP requests within your request handlers
app.use(bodyParser.json());

// Serves all static files in public folder
app.use(express.static('public'));

// GET requests
app.get('/', (req, res) => {
    res.send('Welcome to my korean drama app!');
});

// Displays array
app.get('/kdrama', (req, res) => {
    res.json(topKoreanDramas);
});

// Error response
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! - No kdramas for you. :()');
});

// Listen to request
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
