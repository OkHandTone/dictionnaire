const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

app.use(express.json());

app.get('/', (req, res) => {
  let html = fs.readFileSync('templates/home.html', 'utf8');
  try {
    const stats = JSON.parse(fs.readFileSync('data/stats.json', 'utf8'));
    const top10 = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10);
    html = html.replace(/TOP_WORDS_TITLE/g, 'Sélection des mots les plus appréciés');
    html = html.replace(/TOP_FAVORIS/g, top10.map(([word, count]) => `<li>${word}</li>`).join(''));
  } catch (e) {
    html = html.replace(/TOP_WORDS_TITLE/g, '');
    html = html.replace(/TOP_FAVORIS/g, '');
  }
  res.send(html);
});

app.get('/:word', (req, res) => {
  const wordsData = JSON.parse(fs.readFileSync('data/words.json', 'utf8'));
  const wordObj = wordsData.find(w => w.word && w.word.toLowerCase() === req.params.word.toLowerCase());

  if (!wordObj) {
    const html404 = fs.readFileSync('templates/404.html', 'utf8');
    res.status(404).send(html404);
    return;
  }

  const htmlTemplate = fs.readFileSync('templates/word.html', 'utf8');
  const html = htmlTemplate
    .replace(/WORD_TITLE/g, wordObj.word || '')
    .replace(/WORD_NAME/g, wordObj.word || '')
    .replace(/WORD_GENDER/g, wordObj.gender || '')
    .replace(/WORD_DEFINITION/g, wordObj.definition || '')
    .replace(/WORD_EXAMPLE/g, wordObj.example || '');

  res.send(html);
});

app.get('/random/generate', (req, res) => {
  const wordsData = JSON.parse(fs.readFileSync('data/words.json', 'utf8'));
  const randomIndex = Math.floor(Math.random() * wordsData.length);
  const randomWord = wordsData[randomIndex];
  res.redirect(`/${randomWord.word}`);
});

app.get('/favoris/list', (req, res) => {
  const htmlFavoris = fs.readFileSync('templates/favoris.html', 'utf8');
  res.send(htmlFavoris);
});

app.get('/word/list', (req, res) => {
  const htmlList = fs.readFileSync('templates/list.html', 'utf8');
  const wordsData = JSON.parse(fs.readFileSync('data/words.json', 'utf8'));
  const html = htmlList.replace(/WORD_LIST/g, wordsData.map(word => `<li><a href="/${word.word}">${word.word}</a></li>`).join(''));
  res.send(html);
});

app.get('/user/profile', (req, res) => {
  const profile = fs.readFileSync('templates/profile.html', 'utf8');
  res.send(profile)
});

app.patch('/stats/update', (req, res) => {
  const { word } = req.body;
  const delta = req.body.delta;
  let stats;
  const statsPath = 'data/stats.json';
  try {
    stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  } catch (e) {
    stats = {};
  }
  if (!stats[word]) {
    stats[word] = 0;
  }
  stats[word] += delta;
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');
  res.json({ success: true, word, count: stats[word] });
});

app.post('/matches/username', (req, res) => {
  console.log('update matches api');

  const { word, username } = req.body;
  const matchesPath = 'data/matches.json';
  let matches;
  try {
    matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
  } catch (e) {
    matches = {};
  }
  if (!matches[word]) {
    matches[word] = [];
  }
  if (!matches[word].includes(username)) {
    if (matches[word].length >= 3) {
      matches[word].pop();
    }
    matches[word].unshift(username);
  }
  fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2), 'utf8');
  res.status(201);
});

app.delete('/matches/username', (req, res) => {
  const { word, username } = req.body;
  const matchesPath = 'data/matches.json';
  let matches;
  try {
    matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));
  } catch (e) {
    matches = {};
  }
  if (matches[word]) {
    matches[word] = matches[word].filter(u => u !== username);
  }
  fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2), 'utf8');
  res.status(204);
});

app.get('/matches/list', (req, res) => {
  const { word } = req.query;
  const matchesPath = 'data/matches.json';
  const matches = JSON.parse(fs.readFileSync(matchesPath, 'utf8'));

  res.json({ matches: matches[word] || [] });
});

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});