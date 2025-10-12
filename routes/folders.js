// routes/folders.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Create folder
router.post('/folders', async (req, res) => {
  const user_id = req.user.user_id;
  const { folder_name, parent_folder_id } = req.body || {};
  if (!folder_name) return res.status(400).json({ error: 'folder_name required' });

  try {
    const sql = `INSERT INTO folders (user_id, folder_name, parent_folder_id) VALUES ($1,$2,$3) RETURNING *;`;
    const result = await db.query(sql, [user_id, folder_name, parent_folder_id || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: 'Failed to create folder', details: err.message });
  }
});

// List user's folders
router.get('/folders', async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const sql = `SELECT * FROM folders WHERE user_id = $1 ORDER BY created_at DESC;`;
    const result = await db.query(sql, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('List folders error:', err);
    res.status(500).json({ error: 'Failed to list folders', details: err.message });
  }
});

// Get single folder
router.get('/folders/:id', async (req, res) => {
  const user_id = req.user.user_id;
  const id = req.params.id;
  try {
    const sql = `SELECT * FROM folders WHERE folder_id = $1 AND user_id = $2;`;
    const result = await db.query(sql, [id, user_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get folder error:', err);
    res.status(500).json({ error: 'Failed to get folder', details: err.message });
  }
});

// Update folder
router.put('/folders/:id', async (req, res) => {
  const user_id = req.user.user_id;
  const id = req.params.id;
  const { folder_name, parent_folder_id } = req.body || {};
  try {
    const sql = `UPDATE folders SET folder_name = $1, parent_folder_id = $2 WHERE folder_id = $3 AND user_id = $4 RETURNING *;`;
    const result = await db.query(sql, [folder_name, parent_folder_id || null, id, user_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found or unauthorized' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update folder error:', err);
    res.status(500).json({ error: 'Failed to update folder', details: err.message });
  }
});

// Delete folder
router.delete('/folders/:id', async (req, res) => {
  const user_id = req.user.user_id;
  const id = req.params.id;
  try {
    const sql = `DELETE FROM folders WHERE folder_id = $1 AND user_id = $2 RETURNING folder_id;`;
    const result = await db.query(sql, [id, user_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found or unauthorized' });
    res.status(204).send();
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ error: 'Failed to delete folder', details: err.message });
  }
});

module.exports = router;
