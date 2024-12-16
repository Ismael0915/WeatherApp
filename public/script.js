document.getElementById('weather-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const city = document.getElementById('city').value;

    if (!city) {
        alert('Please enter a city');
        return;
    }

    try {
        const response = await fetch('/api/weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ city }),
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            displayWeather(data.currentWeather);
            storeLastSearch(city);
        }
    } catch (err) {
        console.error('Error fetching weather data:', err);
        alert('Unable to fetch weather data. Please try again.');
    }
});

function displayWeather(data) {
    const tempDivInfo = document.getElementById('temp-div');
    const weatherInfoDiv = document.getElementById('weather-info');
    
    document.getElementById('home').style.display = 'none';
    document.getElementById('temp-screen').style.display = 'block';

    weatherInfoDiv.innerHTML = '';
    tempDivInfo.innerHTML = '';

    const cityName = data.name;
    const temperature = Math.round((data.main.temp - 273.15) * 9 / 5 + 32);
    const description = data.weather[0].description;

    tempDivInfo.innerHTML = `<p>${temperature}°F</p>`;
    weatherInfoDiv.innerHTML = `<p>${cityName}</p><p>${description}</p>`;
}

function storeLastSearch(city) {
    fetch('/api/save-search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city })
    }).then(response => response.json())
      .then(data => console.log('Last search saved:', data))
      .catch(error => console.error('Error saving last search:', error));
}


document.getElementById('previous-search').addEventListener('click', function () {
    fetch('/api/get-last-search')
        .then(response => response.json())
        .then(data => {
            if (data.city) {
                document.getElementById('city').value = data.city;
                document.getElementById('weather-form').dispatchEvent(new Event('submit'));
            } else {
                alert('No previous search found.');
            }
        })
        .catch(error => console.error('Error fetching last search:', error));
});

document.getElementById('home-button').addEventListener('click', function () {
    document.getElementById('temp-screen').style.display = 'none';
    document.getElementById('home').style.display = 'block';
});
