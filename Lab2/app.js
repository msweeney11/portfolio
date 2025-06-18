const express = require('express');
const path = require('path');
const app = express();
const PORT = 5550;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/greet', (req, res) => {
  const name = req.query.name || 'Guest';
  res.send(`Hello, ${name}!`);
});

app.get('/product/:id', (req, res) => {
  res.send(`Product ID requested: ${req.params.id}`);
});

app.get('/user/:username/details', (req, res) => {
  const { username } = req.params;
  const { age } = req.query;
  res.send(`User: ${username}, Age: ${age}`);
});

app.get('/category/:type/item/:itemId', (req, res) => {
  const { type, itemId } = req.params;
  res.send(`Category: ${type}, Item ID: ${itemId}`);
});

app.get('/search', (req, res) => {
  const { term } = req.query;
  res.send(term ? `You searched for: ${term}` : 'No search term provided.');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
