# SimpleBook SaaS - Project Requirements

## 1. Project Assignment

Using AI-assisted development implement and deploy a fully functional multi-page JS app.

· The topic and scope of your project is up to you.

· Examples: blog system, social network, listings website, hotel booking platform, issue tracking system, poll system, meme generator.

## 2. Project Requirements

### Technologies

· Frontend: Implement your app in HTML, CSS, JavaScript and Bootstrap. Use UI libraries and components of your choice. Keep it simple, without TypeScript and UI frameworks like React and Vue.

· Backend: Use Supabase as a backend (database, authentication and storage).

· Build tools: Node.js, npm, Vite

### Architecture

· Use a client-server architecture: JavaScript frontend app with Supabase backend, communicating via the Supabase REST API.

· Use Node.js, npm and Vite to structure your app with modular components.

· Use multi-page navigation (instead of single page with popups) and keep each page in separate file.

· Use modular design: split your app into self-contained components (e.g. UI pages, services, utils) to improve project maintenance. When reasonable, use separate files for the UI, business logic, styles, and other app assets. Avoid big and complex monolith code.

· Define "Agent Instructions" (.github/copilot-instructions.md) to provide app context, architectural guidelines and project-wide instructions for the AI dev agent.

### User Interface (UI)

· Implement minimum 5 app screens (pages / popups / others).

· Example: register, login, main page, view / add / edit / delete entity, admin panel.

· Implement responsive design for desktop and mobile browsers.

· Use icons, effects and visual cues to enhance user experience and make the app more intuitive.

· Place different app screens in separate files (for better maintenance).

### Backend

· Use Supabase as a backend to keep all your app data.

· Use Supabase DB for data tables.

· Use Supabase Auth for authentication (users, register, login, logout).

· Use Supabase Storage to upload photos and files at the server-side.

· Optionally, use Supabase Edge Functions for special server-side interactions.

### Authentication and Authorization

· Use Supabase Auth for authentication and authorization with JWT tokens.

· Implement users (register, login, logout) and roles (normal and admin users).

· Use Row-Level Security (RLS) policies to implement access control.

· If role-based access control (RBAC) is needed, use `user_roles` table + RLS to implement it.

· Implement admin panel (or similar concept for special users, different from regular).

### Database

· Your database should hold minimum 4 DB tables (with relationships when needed).

· Example (blog): users, profiles, articles, photos. Example (social network): users, posts, photos, comments.

· Use best practices to design the Supabase DB schema, including normalization, indexing, and relationships.

· When changing the DB schema, always use Supabase migrations.

· Sync the DB migrations history from Supabase to a local project folder.

· Your DB migration SQL scripts should be committed in the GitHub repo.

### Storage

· Store app user files (like photos and documents) in Supabase Storage.

· Your project should use file upload and download somewhere, e.g. profile pictures or product photos.

### Deployment

· Your project should be deployed live on the Internet (e.g. in Netlify, Vercel or similar platform).

· Provide sample credentials (e.g. demo / demo123) to simplify testing your app.

### GitHub Repo

· Use a GitHub repo to hold your project assets.

Commit and push each successful change during the development.

Your public GitHub repo is the most important project asset for your capstone project. The commit history in your repo demonstrates that you have worked seriously to develop your app yourself, and you have spent several days working on it. Without a solid history of commits in GitHub you cannot demonstrate that your project is your own work (not taken from someone else).

· Create minimum 15 commits in GitHub.

· Create your commits on at least 3 different days.

· Optionally, you can create branches and merge them with pull requests.

### Documentation

· Generate a project documentation in your GitHub repository.

· Project description: describe briefly your project (what it does, who can do what, etc.).

· Architecture: front-end, back-end, technologies used, database, etc.

· Database schema design: visualize the main DB tables and their relationships.

· Local development setup guide.

· Key folders and files and their purpose.

## 3. Project Implementation

Develop your project using modern AI-assisted development, with AI dev agents like GitHub Copilot.

Split the project into manageable steps and use the traditional AI dev loop:

· Prompt Copilot → implement → run → test → refine → commit and push to GitHub / discard changes

Keep full change history in GitHub (commits, pull requests, etc.)
