require('dotenv').config({ path: 'traino/.env.local' });

const app = require('express')();
const MySQL = require('mysql2');

const DB = MySQL.createConnection({
  host: process.env.DB__HOST,
  user: process.env.DB__LOGIN,
  password: process.env.DB__PASSWORD,
  database: process.env.DB,
});

const from = `From ${DB.database}`;

app.get('/api/bugreports', (req, res) => {
  DB.query('SELECT * FROM bugreports', (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

console.log('Connecting to database...', process.env.DB__HOST);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
