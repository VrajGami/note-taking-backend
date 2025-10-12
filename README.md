# Note-Taking Backend — Frontend developer guide

This document explains the API, authentication flow, media handling (base64), and examples a frontend developer needs to integrate the app.

Base assumptions
- Server base URL (development): http://localhost:3000
- All API routes are mounted under `/api`, e.g. POST `/api/login`
- The backend uses JWT access tokens. Send them in the Authorization header as: `Authorization: Bearer <token>`

Quick start (dev)
1. Install and start the backend on your machine:

```powershell
cd "note-taking-backend"
npm install
copy .env.example .env
# edit .env to set JWT_SECRET (or use provided local .env)
npm start
```

Authentication
- Signup: `POST /api/signup`
  - Body (JSON): `{ username, email, password }`
  - Success: `201` and created user object

- Login: `POST /api/login`
  - Body (JSON): `{ email, password }`
  - Success: `200` with `{ token, user_id, message }`
  - Store the returned token on the client (localStorage/sessionStorage or secure cookie).

- Protected requests
  - Include header: `Authorization: Bearer <token>`
  - If token is expired or revoked you will receive `401 Unauthorized`.

- Logout: `POST /api/logout` (protected)
  - Invalidates the token in the server's in-memory blacklist. After logout, that token will no longer be accepted by the running process.

Endpoints & shapes (frontend-focused)

Auth
- `POST /api/signup`
  - Body: `{ username, email, password }`
  - 201 response: `{ message, user }`

- `POST /api/login`
  - Body: `{ email, password }`
  - 200 response example:
    ```json
    {
      "message": "Login successful",
      "token": "<JWT>",
      "user_id": 1
    }
    ```

- `GET /api/me` (protected)
  - Returns: `{ user_id, email }`

- `POST /api/logout` (protected)
  - Returns: `200 { message: 'Logged out' }`

Notes (protected)
- `POST /api/notes` — Create
  - Body: `{ note_title, note_content, folder_id }`
  - Response: `201` created note object

- `GET /api/notes` — List
  - Response: `200` array of notes

- `GET /api/notes/:id` — Get single
  - Response: note object or 404

- `PUT /api/notes/:id` — Update
  - Body: `{ note_title, note_content, folder_id }`
  - Response: updated note

- `DELETE /api/notes/:id` — Delete
  - Response: `204`

Folders (protected)
- `POST /api/folders` `{ folder_name, parent_folder_id }`
- `GET /api/folders`
- `GET /api/folders/:id`
- `PUT /api/folders/:id`
- `DELETE /api/folders/:id`

Tags (protected)
- `POST /api/tags` `{ tag_name }` — creates or returns existing tag
- `GET /api/tags`
- `POST /api/notes/:noteId/tags` `{ tag_id }` — attach tag to note
- `DELETE /api/notes/:noteId/tags/:tagId` — remove tag from note

Media (base64 + file_path) (protected)
The backend supports two ways to attach media to a note:

1) Provide a `file_path` (server will store it as-is in DB).
2) Provide `filename` and `base64` (data URL or raw base64). Server will decode and save the file to `uploads/` and store `/uploads/<file>` as `file_path` in the DB.

- `POST /api/notes/:noteId/media`
  - Body options:
    - `{ file_path: "https://example.com/file.jpg" }`
    - OR `{ filename: "photo.jpg", base64: "data:image/jpeg;base64,...", file_type: "image/jpeg" }`
  - Response: created media record: `{ media_id, note_id, file_path, file_type, uploaded_at }`

- `GET /api/notes/:noteId/media` — list media
  - Query param: `?asBase64=true`
    - Without `asBase64`: returns media rows as stored in DB.
    - With `asBase64=true`: for local files (file_path like `/uploads/<file>`), returns `base64` field containing a `data:[mime];base64,<data>` string. External URLs return `base64: null`.

- `DELETE /api/media/:id` — deletes DB record and removes local file if stored locally.

Frontend integration notes & examples

Uploading a file (browser) as base64 (client-side example):

```javascript
// client-side example: convert file to data URL and upload
async function uploadFile(file, noteId, token) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64 = reader.result; // data:[mime];base64,...
      const resp = await fetch(`/api/notes/${noteId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ filename: file.name, base64 })
      });
      if (!resp.ok) return reject(await resp.text());
      resolve(await resp.json());
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

Listing media and rendering local base64 images:

```javascript
const resp = await fetch(`/api/notes/${noteId}/media?asBase64=true`, { headers: { Authorization: 'Bearer ' + token }});
const media = await resp.json();
media.forEach(m => {
  if (m.base64) {
    const img = document.createElement('img');
    img.src = m.base64; // data URL
    document.body.appendChild(img);
  } else if (m.file_path) {
    // external URL or stored path
    const img = document.createElement('img');
    img.src = m.file_path;
    document.body.appendChild(img);
  }
});
```

Error handling and status codes
- 400 Bad Request — missing/invalid input
- 401 Unauthorized — missing/invalid/expired/revoked token
- 404 Not Found — resource doesn't exist or doesn't belong to user
- 500 Server Error — backend failure

Security & production notes (frontend/back-end coordination)
- Local in-memory token blacklist only works for single-process dev. For multi-instance deployments use a shared store (Redis) for revocation.
- For production media storage: use object storage (S3/GCS) and return URLs or pre-signed upload URLs. Avoid storing large files in the database.
- Use HTTPS; prefer secure, HttpOnly cookies for tokens in browser apps if you control both frontend and backend.
- Consider using short-lived access tokens plus refresh tokens for UX/security.

Troubleshooting
- If protected endpoints return 401: verify the Authorization header is present and token not expired
- If base64 returns null in `GET /api/notes/:noteId/media?asBase64=true`: the file was stored as an external URL or the local file is missing

# Note-Taking Backend

This backend provides authentication and CRUD endpoints for notes, folders, tags and media. Media endpoints support uploading base64-encoded files which are saved to `uploads/` locally (development).

## Running locally

1. Copy `.env.example` to `.env` and set `JWT_SECRET`, `JWT_EXPIRES_IN`, and `SALT_ROUNDS`.
2. Install dependencies:

```powershell
npm install
```

3. Start server:

```powershell
npm start
```

Server runs on port 3000 by default.

## Authentication

- POST /api/signup { username, email, password }
- POST /api/login { email, password } => { token }
- GET /api/me => returns current user (requires Authorization: Bearer <token>)
- POST /api/logout => invalidates token in-memory

## Notes endpoints

- POST /api/notes (protected) { note_title, note_content, folder_id }
- GET /api/notes (protected)
- GET /api/notes/:id (protected)
- PUT /api/notes/:id (protected)
- DELETE /api/notes/:id (protected)

## Folders

- POST /api/folders { folder_name, parent_folder_id }
- GET /api/folders
- GET /api/folders/:id
- PUT /api/folders/:id
- DELETE /api/folders/:id

## Tags

- POST /api/tags { tag_name } - creates or returns existing tag
- GET /api/tags
- POST /api/notes/:noteId/tags { tag_id } - add tag to note
- DELETE /api/notes/:noteId/tags/:tagId - remove tag from note

## Media (base64 upload)

You can attach media to a note by either passing a `file_path` (URL) or sending base64 content. Examples:

- Upload base64:

```json
POST /api/notes/1/media
{
  "filename": "photo.jpg",
  "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

Server will decode and save to `uploads/` and store the path in the DB.

- List media for a note (with base64 content):

```
GET /api/notes/1/media?asBase64=true
```

This will return records with a `base64` field for locally stored files. External URLs will have `base64: null`.

## Notes & next steps

- The media storage is local and intended for development. For production use S3 or another file store.
- The token blacklist is in-memory; for multiple instances use Redis.
- Add validation (express-validator) and tests for production readiness.
