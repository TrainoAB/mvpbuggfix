const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
const address = '1600 Amphitheatre Parkway, Mountain View, CA'; // Example address to geocode

// Construct the API request URL
const baseUrl = 'https://nominatim.openstreetmap.org';
const endpoint = '/search';
const format = 'json';
const query = encodeURIComponent(address);
const apiUrl = `${baseUrl}${endpoint}?q=${query}&format=${format}`;

// Make the HTTP request
fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    // Process the response
    if (data && data.length > 0) {
      // Extract latitude and longitude from the first result
      const latitude = data[0].lat;
      const longitude = data[0].lon;
      DEBUG && console.log('Latitude:', latitude);
      DEBUG && console.log('Longitude:', longitude);
    } else {
      console.error('No results found.');
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
