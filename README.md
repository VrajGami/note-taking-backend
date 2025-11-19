# 📝 Note-Taking Application

A full-stack note-taking application built with **Angular** (frontend) and **Node.js/Express** (backend) with **PostgreSQL** database.

## 🚀 Features

### User Management
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Secure password hashing with bcrypt
- ✅ Session management

### Note Management
- ✅ Create, read, update, delete notes
- ✅ Rich text editing
- ✅ Auto-save functionality (2-second debounce)
- ✅ Real-time search
- ✅ Character and word count

### Organization
- ✅ Folder system with nested folders support
- ✅ Drag and drop notes to folders
- ✅ Tag system for categorization
- ✅ Color-coded tags

### User Interface
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Custom confirmation dialogs
- ✅ Dark sidebar with modern UI
- ✅ Hot Module Replacement (HMR)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 19.0.0
- **Language**: TypeScript 5.7.2
- **Styling**: CSS3 + Bootstrap 5.3.8
- **Icons**: Bootstrap Icons 1.13.1
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS (BehaviorSubjects, Observables)

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Database**: PostgreSQL 18
- **ORM**: pg (node-postgres) 8.16.3
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 6.0.0
- **Environment**: dotenv 16.3.1
- **CORS**: cors 2.8.5

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v16 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **Angular CLI** (optional but recommended):
  ```bash
  npm install -g @angular/cli
  ```

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/VrajGami/note-taking-backend.git
cd note-taking-backend
```

### Step 2: Set Up PostgreSQL Database

#### Option A: Using psql Command Line

1. **Create a PostgreSQL user:**
   ```bash
   # On Windows (PowerShell):
   & "C:\Program Files\PostgreSQL\18\bin\createuser.exe" -U postgres notes_user -P
   
   # On Mac/Linux:
   sudo -u postgres createuser notes_user -P
   ```
   Enter password: `StrongLocalPassword123!`

2. **Create the database:**
   ```bash
   # On Windows (PowerShell):
   & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres -O notes_user notes_db
   
   # On Mac/Linux:
   sudo -u postgres createdb -O notes_user notes_db
   ```

3. **Run the schema:**
   ```bash
   # On Windows (PowerShell):
   $env:PGPASSWORD='StrongLocalPassword123!'; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U notes_user -d notes_db -f schema.sql
   
   # On Mac/Linux:
   PGPASSWORD='StrongLocalPassword123!' psql -U notes_user -d notes_db -f schema.sql
   ```

#### Option B: Using pgAdmin GUI

1. Open pgAdmin
2. Right-click on "Login/Group Roles" → Create → Login/Group Role
   - Name: `notes_user`
   - Password: `StrongLocalPassword123!`
   - Privileges: Can login = Yes
3. Right-click on "Databases" → Create → Database
   - Database: `notes_db`
   - Owner: `notes_user`
4. Open Query Tool and paste the contents of `schema.sql`, then execute

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example
cp .env.example .env  # Linux/Mac
copy .env.example .env  # Windows
```

Or create `.env` manually with these contents:

```env
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=dev-super-secret-change-me
JWT_EXPIRES_IN=1d
SALT_ROUNDS=10

# PostgreSQL
DATABASE_URL=postgres://notes_user:StrongLocalPassword123!@localhost:5432/notes_db

# Upload directory
UPLOAD_DIR=uploads
```

### Step 4: Install Backend Dependencies

```bash
npm install
```

### Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## 🏃 Running the Application

### Development Mode

You'll need **two terminal windows** - one for backend, one for frontend.

#### Terminal 1: Start Backend Server

```bash
npm start
```

Backend will run on: **http://localhost:3000**

You should see:
```
DATABASE_URL: Loaded
Database config: { user: 'notes_user', host: 'localhost', port: 5432, database: 'notes_db' }
Server listening on port 3000
Database connected successfully at: [timestamp]
```

#### Terminal 2: Start Frontend Server

```bash
cd frontend
npm start
# or
npx ng serve
```

Frontend will run on: **http://localhost:4200**

Open your browser and navigate to: **http://localhost:4200**

---

## 📁 Project Structure

```
note-taking-backend/
├── frontend/                          # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── dashboard/         # Main dashboard component
│   │   │   │   ├── login/             # Login page
│   │   │   │   ├── register/          # Registration page
│   │   │   │   ├── notes/
│   │   │   │   │   ├── note-editor/   # Note editor with auto-save
│   │   │   │   │   └── note-list/     # Notes list view
│   │   │   │   └── shared/
│   │   │   │       └── confirmation-dialog/  # Custom modal dialogs
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts    # Authentication service
│   │   │   │   ├── notes.service.ts   # Notes CRUD operations
│   │   │   │   ├── folders.service.ts # Folders management
│   │   │   │   └── tags.service.ts    # Tags management
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts      # Route protection
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts # JWT token injection
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── routes/                            # Backend API Routes
│   ├── auth.js                        # Authentication endpoints
│   ├── notes.js                       # Notes CRUD endpoints
│   ├── folders.js                     # Folders CRUD endpoints
│   ├── tags.js                        # Tags CRUD endpoints
│   ├── media.js                       # Media upload endpoints
│   └── db-test.js                     # Database test endpoint
│
├── middleware/
│   └── auth.js                        # JWT verification middleware
│
├── utils/
│   └── tokenStore.js                  # Token blacklist management
│
├── uploads/                           # File uploads directory
│
├── .env                               # Environment variables (create this)
├── .gitignore
├── config.js                          # Configuration loader
├── db.js                              # Database connection pool
├── package.json
├── schema.sql                         # Database schema
├── server.js                          # Express server entry point
└── README.md                          # This file
```

---

## 🗄️ Database Schema

### Tables

1. **users** - User accounts
   - `user_id` (Primary Key)
   - `username` (Unique)
   - `email` (Unique)
   - `password_hash`
   - `created_at`

2. **folders** - Organization folders
   - `folder_id` (Primary Key)
   - `user_id` (Foreign Key)
   - `folder_name`
   - `parent_folder_id` (Foreign Key - self-referencing)
   - `created_at`

3. **notes** - User notes
   - `note_id` (Primary Key)
   - `user_id` (Foreign Key)
   - `folder_id` (Foreign Key)
   - `note_title`
   - `note_content`
   - `created_at`
   - `updated_at`

4. **tags** - Tags for categorization
   - `tag_id` (Primary Key)
   - `tag_name` (Unique)

5. **note_tags** - Many-to-many relationship
   - `note_id` (Foreign Key)
   - `tag_id` (Foreign Key)

6. **media** - File attachments
   - `media_id` (Primary Key)
   - `note_id` (Foreign Key)
   - `file_path`
   - `file_type`
   - `uploaded_at`

---

## 🔌 API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - User login
- `GET /api/me` - Get current user (protected)
- `POST /api/logout` - Logout user (protected)

### Notes
- `GET /api/notes` - Get all user notes (protected)
- `GET /api/notes/:id` - Get single note (protected)
- `POST /api/notes` - Create new note (protected)
- `PUT /api/notes/:id` - Update note (protected)
- `DELETE /api/notes/:id` - Delete note (protected)

### Folders
- `GET /api/folders` - Get all user folders (protected)
- `GET /api/folders/:id` - Get single folder (protected)
- `POST /api/folders` - Create new folder (protected)
- `PUT /api/folders/:id` - Update folder (protected)
- `DELETE /api/folders/:id` - Delete folder (protected)

### Tags
- `GET /api/tags` - Get all tags (protected)
- `POST /api/tags` - Create new tag (protected)
- `POST /api/notes/:noteId/tags` - Add tag to note (protected)
- `DELETE /api/notes/:noteId/tags/:tagId` - Remove tag from note (protected)

### Media
- `POST /api/notes/:noteId/media` - Upload file (protected)
- `GET /api/media/:mediaId` - Get file (protected)
- `DELETE /api/media/:mediaId` - Delete file (protected)

---

## 🧪 Testing

### Test Database Connection
```bash
curl http://localhost:3000/api/db-test
```

### Test Registration
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🚀 Deployment

### Frontend - Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set Root Directory to `frontend`
4. Deploy

### Backend - Render

1. Create account at [render.com](https://render.com)
2. Create PostgreSQL database
3. Create Web Service
4. Add environment variables
5. Deploy

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ Token blacklisting on logout
- ✅ Protected API routes with middleware
- ✅ CORS configuration
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation

---

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `Error: connect ECONNREFUSED`
- **Solution**: Make sure PostgreSQL is running
  ```bash
  # Windows
  Get-Service -Name postgresql*
  
  # Linux/Mac
  sudo service postgresql status
  ```

**Issue**: `password authentication failed for user`
- **Solution**: Check your `.env` file DATABASE_URL credentials

**Issue**: `relation "users" does not exist`
- **Solution**: Run the schema.sql file again

### Frontend Issues

**Issue**: `Cannot GET /api/notes`
- **Solution**: Make sure backend is running on port 3000

**Issue**: `CORS error`
- **Solution**: Backend CORS is configured for `http://localhost:4200`

**Issue**: `ng: command not found`
- **Solution**: Install Angular CLI: `npm install -g @angular/cli`

---

## 📦 Dependencies

### Backend
```json
{
  "bcrypt": "^6.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^5.1.0",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.16.3"
}
```

### Frontend
```json
{
  "@angular/core": "^19.2.0",
  "@angular/common": "^19.2.0",
  "@angular/router": "^19.2.0",
  "@angular/forms": "^19.2.0",
  "bootstrap": "^5.3.8",
  "bootstrap-icons": "^1.13.1",
  "rxjs": "~7.8.0",
  "zone.js": "~0.15.0"
}
```

---

## 👥 Contributors

- **Vraj Gami** - Full Stack Development

---

## 📝 License

This project is created for educational purposes - CPSC-271 Web Development course.

---

## 🙏 Acknowledgments

- Angular team for the amazing framework
- Express.js for the backend framework
- PostgreSQL for the robust database
- Bootstrap for UI components

---

## 📧 Contact

For any questions or issues, please open an issue in the GitHub repository.

---

## 🔄 Version History

- **v1.0.0** (January 2025)
  - Initial release
  - Full CRUD functionality
  - Authentication system
  - Folder and tag organization
  - Custom confirmation dialogs
  - Responsive design

---

**Happy Note Taking! 📝✨**

