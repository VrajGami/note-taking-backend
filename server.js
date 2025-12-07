// server.js
require("dotenv").config();
const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser'); 
const cors = require('cors'); 
const serverless = require('serverless-http'); // <--- CRITICAL CHANGE 1: Import wrapper

// Import Routes
const notesRouter = require('./routes/notes');
const authRouter = require('./routes/auth'); 
const dbTestRouter = require('./routes/db-test');
const foldersRouter = require('./routes/folders');
const tagsRouter = require('./routes/tags');
const mediaRouter = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware Setup
app.use(cors()); 
app.use(bodyParser.json()); 

// 2. API Routes
app.use('/api', authRouter);
app.use('/api', notesRouter); 
app.use('/api', dbTestRouter);
app.use('/api', foldersRouter);
app.use('/api', tagsRouter);
app.use('/api', mediaRouter);

// 3. Root Route
app.get('/', (req, res) => {
    res.send('Note-Taking Backend is running!');
});

// 4. Start the server (Dual Mode)
// This "if" statement allows the code to run on your laptop AND on AWS Lambda without crashing.
if (require.main === module) {
    // This runs only when you type "node server.js" locally
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

// 5. Export for Lambda
// This is what AWS looks for to start your app
// Fix: Tell the app to ignore the '/default' prefix from AWS
module.exports.handler = serverless(app, { basePath: '/default' });