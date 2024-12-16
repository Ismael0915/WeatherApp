const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(express.static('public'));

const client = new MongoClient(process.env.MONGO_URI);
let db;

client.connect()
    .then(() => {
        db = client.db('weatherApp');
    })
    .catch(err => console.error('Failed to connect to MongoDB', err));

app.post('/api/weather', async (req, res) => {
    const { city } = req.body;
    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
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

app.post('/api/save-search', async (req, res) => {
    const { city } = req.body;

    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
        const searches = db.collection('searches');
        await searches.deleteMany({});
        await searches.insertOne({ city, date: new Date() });

        res.json({ message: 'Search saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving search' });
    }
});

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
