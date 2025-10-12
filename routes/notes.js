// routes/notes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); 
const authMiddleware = require('../middleware/auth'); 

// ----------------------------------------------------------------
// 1. ACTIVATE AUTHENTICATION MIDDLEWARE
// All routes below this line will require a valid JWT in the 
// 'Authorization: Bearer <token>' header.
// The user ID will be available via req.user.user_id
// ----------------------------------------------------------------
router.use(authMiddleware); 




// 1. CREATE a new note (C)
// POST /api/notes
router.post('/notes', async (req, res) => {
    // Get user_id SECURELY from the request object set by the middleware
    const user_id = req.user.user_id; 
    const { note_title, note_content, folder_id } = req.body; 

    // Handle optional folder_id by allowing it to be NULL
    const folderId = folder_id || null;

    try {
        const sql = `
            INSERT INTO notes (user_id, folder_id, note_title, note_content) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const result = await db.query(sql, [user_id, folderId, note_title, note_content]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ error: 'Failed to create note', details: err.message });
    }
});


// 2. READ all notes for a user (R)
// GET /api/notes
router.get('/notes', async (req, res) => {
    // Get user_id SECURELY from the request object set by the middleware
    const user_id = req.user.user_id; 

    try {
        const sql = `
            SELECT 
                n.note_id, 
                n.note_title, 
                n.note_content, 
                n.created_at, 
                n.updated_at,
                f.folder_name, 
                f.folder_id
            FROM notes n
            LEFT JOIN folders f ON n.folder_id = f.folder_id
            WHERE n.user_id = $1
            ORDER BY n.updated_at DESC;
        `;
        const result = await db.query(sql, [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
    }
});


// 3. READ a single note by ID (R)
// GET /api/notes/:id
router.get('/notes/:id', async (req, res) => {
    // Get user_id SECURELY from the request object set by the middleware
    const user_id = req.user.user_id; 
    const note_id = req.params.id;

    try {
        // Ensure the note belongs to the authenticated user
        const sql = 'SELECT * FROM notes WHERE note_id = $1 AND user_id = $2;';
        const result = await db.query(sql, [note_id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching single note:', err);
        res.status(500).json({ error: 'Failed to fetch note', details: err.message });
    }
});


// 4. UPDATE an existing note (U)
// PUT /api/notes/:id
router.put('/notes/:id', async (req, res) => {
    // Get user_id SECURELY from the request object set by the middleware
    const user_id = req.user.user_id; 
    const note_id = req.params.id;
    const { note_title, note_content, folder_id } = req.body;

    // Handle optional folder_id
    const folderId = folder_id || null;

    try {
        // Ensure the update only happens if the note belongs to the authenticated user
        const sql = `
            UPDATE notes 
            SET 
                note_title = $1, 
                note_content = $2, 
                folder_id = $3, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE note_id = $4 AND user_id = $5
            RETURNING *;
        `;
        const result = await db.query(sql, [note_title, note_content, folderId, note_id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating note:', err);
        res.status(500).json({ error: 'Failed to update note', details: err.message });
    }
});


// 5. DELETE a note (D)
// DELETE /api/notes/:id
router.delete('/notes/:id', async (req, res) => {
    // Get user_id SECURELY from the request object set by the middleware
    const user_id = req.user.user_id; 
    const note_id = req.params.id;

    try {
        // Ensure the deletion only happens if the note belongs to the authenticated user
        const sql = 'DELETE FROM notes WHERE note_id = $1 AND user_id = $2 RETURNING note_id;';
        const result = await db.query(sql, [note_id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found or unauthorized' });
        }
        res.status(204).send(); 
    } catch (err) {
        console.error('Error deleting note:', err);
        res.status(500).json({ error: 'Failed to delete note', details: err.message });
    }
});


module.exports = router;