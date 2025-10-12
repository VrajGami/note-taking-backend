// routes/tags.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Create or get tag by name
router.post('/tags', async (req, res) => {
  const { tag_name } = req.body || {};
  if (!tag_name) return res.status(400).json({ error: 'tag_name required' });
  try {
    // Try to insert, on conflict return existing
    const sql = `INSERT INTO tags (tag_name) VALUES ($1) ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name RETURNING *;`;
    const result = await db.query(sql, [tag_name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Failed to create tag', details: err.message });
  }
});

// List all tags
router.get('/tags', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tags ORDER BY tag_name;');
    res.json(result.rows);
  } catch (err) {
    console.error('List tags error:', err);
    res.status(500).json({ error: 'Failed to list tags', details: err.message });
  }
});

// Add tag to a note
router.post('/notes/:noteId/tags', async (req, res) => {
  const user_id = req.user.user_id;
  const noteId = req.params.noteId;
  const { tag_id } = req.body || {};
  if (!tag_id) return res.status(400).json({ error: 'tag_id required' });

  try {
    // Ensure note belongs to user
    const noteRes = await db.query('SELECT * FROM notes WHERE note_id = $1 AND user_id = $2', [noteId, user_id]);
    if (noteRes.rows.length === 0) return res.status(404).json({ error: 'Note not found or unauthorized' });

    await db.query('INSERT INTO note_tags (note_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [noteId, tag_id]);
    res.status(201).json({ message: 'Tag added to note' });
  } catch (err) {
    console.error('Add tag to note error:', err);
    res.status(500).json({ error: 'Failed to add tag', details: err.message });
  }
});

// Remove tag from note
router.delete('/notes/:noteId/tags/:tagId', async (req, res) => {
  const user_id = req.user.user_id;
  const noteId = req.params.noteId;
  const tagId = req.params.tagId;
  try {
    const noteRes = await db.query('SELECT * FROM notes WHERE note_id = $1 AND user_id = $2', [noteId, user_id]);
    if (noteRes.rows.length === 0) return res.status(404).json({ error: 'Note not found or unauthorized' });

    const result = await db.query('DELETE FROM note_tags WHERE note_id = $1 AND tag_id = $2 RETURNING note_id', [noteId, tagId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tag not associated with note' });
    res.status(204).send();
  } catch (err) {
    console.error('Remove tag from note error:', err);
    res.status(500).json({ error: 'Failed to remove tag', details: err.message });
  }
});

module.exports = router;
