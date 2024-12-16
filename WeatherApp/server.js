const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

client.connect()
    .then(() => {
        db = client.db('weatherApp'); // Use or create the database named "weatherApp"
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Routes
app.post('/api/weather', async (req, res) => {
    const { city } = req.body;
    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
        // Fetch weather data
        const apiKey = process.env.API_KEY;
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

        const currentWeatherRes = await fetch(currentWeatherUrl);
        const currentWeather = await currentWeatherRes.json();

        if (currentWeather.cod === '404') {
            return res.status(404).json({ error: 'City not found' });
        }

        res.json({ currentWeather });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

// Save the last search to MongoDB
app.post('/api/save-search', async (req, res) => {
    const { city } = req.body;

    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
        const searches = db.collection('searches');
        await searches.deleteMany({}); // Optional: Only keep the last search in the DB
        await searches.insertOne({ city, date: new Date() });

        res.json({ message: 'Search saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving search' });
    }
});

// Get the last search from MongoDB
app.get('/api/get-last-search', async (req, res) => {
    try {
        const searches = db.collection('searches');
        const lastSearch = await searches.findOne({}, { sort: { date: -1 } });

        if (lastSearch) {
            res.json({ city: lastSearch.city });
        } else {
            res.json({ city: null });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving last search' });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
