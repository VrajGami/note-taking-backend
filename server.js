// server.js
// Load config early so missing env variables fail fast
const config = require('./config');

const express = require('express');
const bodyParser = require('body-parser'); // Middleware to parse JSON bodies
const cors = require('cors'); // Essential for connecting Angular frontend

const notesRouter = require('./routes/notes');
const authRouter = require('./routes/auth'); // For login/signup
const dbTestRouter = require('./routes/db-test');
const foldersRouter = require('./routes/folders');
const tagsRouter = require('./routes/tags');
const mediaRouter = require('./routes/media');
const app = express();
const PORT = process.env.PORT || 3000; // Use port 3000 or the environment variable

// 1. Middleware Setup
app.use(cors()); // Allow your Angular frontend to make requests
app.use(bodyParser.json()); // Allows Express to read JSON data sent from Angular

// 2. API Routes
app.use('/api', authRouter);
app.use('/api', notesRouter); 
app.use('/api', dbTestRouter); // Notes endpoints will start with /api (e.g., /api/notes)
app.use('/api', foldersRouter);
app.use('/api', tagsRouter);
app.use('/api', mediaRouter);

// 3. Simple root route check
app.get('/', (req, res) => {
    res.send('Note-Taking Backend is running!');
});

// 4. Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});