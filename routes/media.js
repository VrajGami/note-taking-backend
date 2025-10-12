// routes/media.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

router.use(authMiddleware);

function randomFilename(ext = '') {
  return `${crypto.randomBytes(12).toString('hex')}${ext ? '.' + ext : ''}`;
}

// Add media entry for a note
// Accepts either { file_path } OR { filename, base64, file_type }
router.post('/notes/:noteId/media', async (req, res) => {
  const user_id = req.user.user_id;
  const noteId = req.params.noteId;
  const { file_path, filename, base64, file_type } = req.body || {};

  if (!file_path && !(filename && base64)) {
    return res.status(400).json({ error: 'Provide file_path OR filename+base64' });
  }

  try {
    const noteRes = await db.query('SELECT * FROM notes WHERE note_id = $1 AND user_id = $2', [noteId, user_id]);
    if (noteRes.rows.length === 0) return res.status(404).json({ error: 'Note not found or unauthorized' });

    let storedPath = file_path;

    if (base64) {
      // Decode base64 and write file
      const matches = base64.match(/^data:(.+);base64,(.*)$/);
      let dataBuffer;
      let ext = '';
      if (matches) {
        // data:[mime];base64,[data]
        const mime = matches[1];
        const b64 = matches[2];
        dataBuffer = Buffer.from(b64, 'base64');
        // try to guess extension from mime
        const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3' };
        ext = extMap[mime] || '';
      } else {
        // raw base64 without data: prefix
        dataBuffer = Buffer.from(base64, 'base64');
        // try to use provided filename ext
        ext = path.extname(filename || '') ? path.extname(filename).replace('.', '') : '';
      }

      const outName = randomFilename(ext);
      const outPath = path.join(UPLOAD_DIR, outName);
      fs.writeFileSync(outPath, dataBuffer);
      storedPath = `/uploads/${outName}`; // store relative path
    }

    const sql = `INSERT INTO media (note_id, file_path, file_type) VALUES ($1,$2,$3) RETURNING *;`;
    const result = await db.query(sql, [noteId, storedPath, file_type || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add media error:', err);
    res.status(500).json({ error: 'Failed to add media', details: err.message });
  }
});

// List media for a note. Optionally return base64 content with ?asBase64=true
router.get('/notes/:noteId/media', async (req, res) => {
  const user_id = req.user.user_id;
  const noteId = req.params.noteId;
  const asBase64 = (req.query.asBase64 || '') === 'true';
  try {
    const noteRes = await db.query('SELECT * FROM notes WHERE note_id = $1 AND user_id = $2', [noteId, user_id]);
    if (noteRes.rows.length === 0) return res.status(404).json({ error: 'Note not found or unauthorized' });

    const result = await db.query('SELECT * FROM media WHERE note_id = $1 ORDER BY uploaded_at DESC', [noteId]);
    const rows = result.rows;

    if (!asBase64) return res.json(rows);

    // convert file_path->base64 for file paths that are local uploads
    const out = await Promise.all(rows.map(async r => {
      const fp = r.file_path || '';
      if (fp.startsWith('/uploads/') || fp.startsWith('uploads/')) {
        const local = path.join(UPLOAD_DIR, path.basename(fp));
        try {
          const buf = fs.readFileSync(local);
          // try to infer mime from extension
          const ext = path.extname(local).toLowerCase().replace('.', '');
          const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg' };
          const mime = mimeMap[ext] || 'application/octet-stream';
          return { ...r, base64: `data:${mime};base64,${buf.toString('base64')}` };
        } catch (e) {
          return { ...r, base64: null, _error: 'file not found' };
        }
      }
      // for external URLs or unknown paths, don't fetch them; return as-is
      return { ...r, base64: null };
    }));

    res.json(out);
  } catch (err) {
    console.error('List media error:', err);
    res.status(500).json({ error: 'Failed to list media', details: err.message });
  }
});

// Delete media (also delete local file if stored locally)
router.delete('/media/:id', async (req, res) => {
  const user_id = req.user.user_id;
  const id = req.params.id;
  try {
    const mediaRes = await db.query('SELECT m.* FROM media m JOIN notes n ON m.note_id = n.note_id WHERE m.media_id = $1 AND n.user_id = $2', [id, user_id]);
    if (mediaRes.rows.length === 0) return res.status(404).json({ error: 'Media not found or unauthorized' });

    const fp = mediaRes.rows[0].file_path || '';
    if (fp.startsWith('/uploads/') || fp.startsWith('uploads/')) {
      const local = path.join(UPLOAD_DIR, path.basename(fp));
      try { fs.unlinkSync(local); } catch (e) { /* ignore */ }
    }

    await db.query('DELETE FROM media WHERE media_id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Failed to delete media', details: err.message });
  }
});

module.exports = router;
