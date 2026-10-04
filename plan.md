### Storage Recommendation

Use **local disk storage with Multer** managed directly by Express:

* Files are uploaded to an isolated directory on your server (e.g., `uploads/{clientId}/{projectId}/`) using unique UUID filenames to prevent collisions.
* Express serves them securely via a protected route (`GET /api/assets/:id/download`) that verifies user or client share-token permissions, eliminating any reliance on AWS S3 or third-party buckets.

---

### Database Schema Blueprint (MySQL)

```sql
-- Users (Freelancer / Business Admin)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients
CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  company VARCHAR(100),
  share_token VARCHAR(64) UNIQUE NOT NULL, -- For non-authenticated, read-only client portal
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  github_repo VARCHAR(255), -- e.g., 'owner/repo'
  status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tasks (Kanban items)
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'review', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  sort_order INT DEFAULT 0,
  is_client_visible BOOLEAN DEFAULT TRUE, -- Allows hiding internal technical tasks from client view
  due_date DATE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Assets
CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by ENUM('freelancer', 'client') DEFAULT 'freelancer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

```

---

### Backend Plan (Express.js + MySQL)

*Hints for Frontend: APIs return normalized JSON structures matching Mantine component states (`data`, `isLoading`, `error`). Status codes follow standard REST conventions.*

1. **Authentication & Authorization (`/api/auth`)**
* JWT-based authentication for the freelancer dashboard.
* *FE Hint:* Supplies bearer token stored in localStorage/session; consumed by Mantine Auth screens and Axios/Fetch interceptor.


2. **Client Management (`/api/clients`)**
* CRUD endpoints for clients. Generates an immutable, cryptographic `share_token` (using Node `crypto.randomBytes`) on client creation.
* *FE Hint:* Provides data for Mantine `Select` dropdowns and Client Card lists; provides the unique share URL displayed in a copy-to-clipboard button.


3. **Projects & GitHub Integration (`/api/projects`)**
* CRUD endpoints linked to `client_id`.
* `GET /api/projects/:id/github-commits`: Backend extracts `owner/repo` from stored GitHub URL and queries the GitHub REST API (`[https://api.github.com/repos/](https://api.github.com/repos/){owner}/{repo}/commits?per_page=5`). It parses and caches the last 5 commits (`sha`, `commit.message`, `commit.author.date`, `html_url`).
* *FE Hint:* Feeds the Mantine `Timeline` component with commit ID badges and commit messages without exposing GitHub API limits to the browser.


4. **Kanban Tasks (`/api/tasks`)**
* `GET /api/projects/:id/tasks`: Fetches tasks grouped or ordered by `status` and `sort_order`.
* `PATCH /api/tasks/:id/move`: Updates `status` and `sort_order` in bulk when an item drops in the Kanban UI.
* *FE Hint:* Expects `{ taskId, newStatus, newSortOrder }` payload triggered by the drag-and-drop end event.


5. **Self-Hosted Asset Pipeline (`/api/assets`)**
* `POST /api/projects/:id/assets`: Uses `multer.diskStorage()` to write directly to `/server/uploads/{projectId}/`. Saves metadata into the `assets` table.
* `GET /api/assets/:id/download`: Validates JWT or query `token` before streaming the file via `res.download()`.
* *FE Hint:* Compatible with Mantine `@mantine/dropzone` multi-file upload progress.


6. **Client-Facing Public Portal (`/api/portal/:shareToken`)**
* Read-only endpoint returning client details, active projects, progress percentage (completed tasks / visible tasks), download links for assets, and visible tasks only (`is_client_visible = true`).
* *FE Hint:* Dedicated endpoint powering the clean, zero-login `/portal/:shareToken` client route.



---

### Frontend Plan (React + Mantine UI + Lucide)

*Hints for Backend: Requests sent via centralized API instance with base URL `/api`. File uploads use `multipart/form-data`.*

1. **Theme & Shell Configuration**
* Mantine `ColorSchemeProvider` defaulted to dark mode with a toggle in the header.
* `AppShell` with responsive `Navbar` (collapsing into a burger menu on mobile) and `Header`.
* Lucide React icons (`LayoutDashboard`, `KanbanSquare`, `Users`, `FolderGit2`, `UploadCloud`, `CheckCircle2`).


2. **Client & Project Dashboard (`/projects`)**
* Mantine `Grid` containing client selector, project cards, and quick progress bars (`Progress` component).
* *BE Hint:* Consumes `GET /api/clients` and `GET /api/projects?clientId=:id`.


3. **Kanban Board View (`/projects/:id/board`)**
* Built with `@hello-pangea/dnd` or `@dnd-kit` styled using Mantine `Card`, `Badge`, and `Paper`.
* 4 columns: *To Do*, *In Progress*, *Under Review*, *Done*.
* Column cards show title, priority badge, due date, and a toggle for "Visible to Client".
* Drag-and-drop triggers optimistic UI updates immediately, syncing with the backend in the background.
* *BE Hint:* Emits `PATCH /api/tasks/:id/move` with updated status and sequence index.


4. **GitHub & Assets Panel (Project Details Tab)**
* **GitHub Commits:** Mantine `Timeline` component. Displays Git hash in a `Badge`, relative time via `date-fns`, and commit message with Lucide `GitCommit` icons.
* **Asset Vault:** `@mantine/dropzone` for file uploading, combined with a Mantine `Table` or grid showing file size, format icons (PDF, image, zip), and download triggers.
* *BE Hint:* Hits `GET /api/projects/:id/github-commits` and `POST /api/projects/:id/assets`.


5. **Client Read-Only Portal (`/portal/:token`)**
* Lightweight, distraction-free view without the administrative sidebar or navigation headers.
* Translates technical Kanban statuses into friendly progress metrics:
* Overall Project Health Bar (e.g., "75% Completed").
* "What We're Working On" list (maps to `in_progress`).
* "Recently Finished" list (maps to `done`).
* Client Asset Box: Grid with download links for deliverables and an upload box for client-supplied files.


* *BE Hint:* Driven entirely by `GET /api/portal/:token`.



---

### Step-by-Step Execution Sequence

1. **Phase 1: Foundation (Days 1–2)**
* Initialize Express backend with MySQL connection pool (`mysql2/promise`).
* Run migration script for database tables.
* Configure Multer disk storage and static download handler.
* Scaffold React app with Mantine UI, dark theme provider, and React Router.


2. **Phase 2: Core Project & Task APIs (Days 3–4)**
* Build CRUD endpoints for clients, projects, and tasks.
* Implement GitHub API controller for repository commit inspection.
* Create Mantine client/project management forms and modals.


3. **Phase 3: Interactive Kanban & Drag-and-Drop (Days 5–6)**
* Implement drag-and-drop task board with Mantine cards.
* Add backend reordering and status change synchronization.
* Add task creation modal with client visibility toggles.


4. **Phase 4: Assets & Client Share Portal (Days 7–8)**
* Integrate Mantine Dropzone with the local Multer upload endpoint.
* Build the standalone, mobile-responsive Client Portal view (`/portal/:token`).
* Conduct mobile responsiveness audit on all Mantine grids and tables.