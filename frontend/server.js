const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory
app.use(express.static('./dist/note-taking-frontend/browser'));

// Send all requests to index.html
app.get('/*', (req, res) =>
    res.sendFile('index.html', { root: 'dist/note-taking-frontend/browser/' }),
);

// Start the app by listening on the default Heroku port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
