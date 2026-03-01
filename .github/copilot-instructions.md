# SimpleBook SaaS - Copilot Instructions

## Project Overview
SimpleBook is a multi-page Booking SaaS application designed for small businesses to manage appointments and services efficiently.

## Technology Stack
- **Frontend**: Vanilla JavaScript (ES modules), HTML5, CSS3
- **UI Framework**: Bootstrap 5
- **Build Tool**: Vite, Node.js, npm
- **Backend**: Supabase (Authentication, Database, Storage)
- **Architecture**: Multi-Page Application (MPA) - No SPA routing. Each screen is a separate .html file.

## Project Structure
```
simplebook-saas/
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── modules/
│   │   └── auth.js              (Supabase authentication module)
│   ├── pages/
│   │   ├── login.js             (Login page handler)
│   │   ├── register.js          (Register page handler)
│   │   ├── dashboard.js         (Business owner dashboard)
│   │   └── booking.js           (Client booking interface)
│   ├── services/
│   │   └── supabase.js          (Supabase client initialization)
│   ├── utils/
│   │   ├── validators.js        (Form validation helpers)
│   │   ├── formatters.js        (Date/time/text formatters)
│   │   └── constants.js         (App-wide constants)
│   ├── main.js                  (Global initialization)
│   └── style.css                (Global styles)
├── public/                       (Static assets)
├── index.html                   (Landing page)
├── login.html                   (Login page)
├── register.html                (Registration page)
├── dashboard.html               (Business owner dashboard)
├── booking.html                 (Client booking page)
├── package.json
├── vite.config.js
└── README.md
```

## Required Pages
1. **index.html** - Landing page explaining the product features, pricing, and call-to-action buttons
2. **login.html** - Authentication page for both business owners and clients
3. **register.html** - Registration page with account type selection
4. **dashboard.html** - Admin panel for business owners to:
   - Manage available services
   - View and manage appointments
   - Manage business profile
5. **booking.html** - Public page where clients can book appointments

## Database Schema (4 core tables)

### 1. profiles
Stores business owner and client profile information.
```
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- account_type (ENUM: 'business' | 'client')
- email (TEXT, unique)
- full_name (TEXT, for clients)
- phone (TEXT, optional)
- business_name (TEXT, for business owners)
- business_type (TEXT, for business owners)
- business_description (TEXT, optional)
- profile_image_url (TEXT, optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. services
Services offered by business owners.
```
- id (UUID, Primary Key)
- business_id (UUID, Foreign Key to profiles)
- name (TEXT)
- description (TEXT, optional)
- duration_minutes (INTEGER)
- price (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. clients
Client contact information and relationships.
```
- id (UUID, Primary Key)
- business_id (UUID, Foreign Key to profiles)
- profile_id (UUID, Foreign Key to profiles, for registered clients)
- email (TEXT)
- full_name (TEXT)
- phone (TEXT, optional)
- notes (TEXT, optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 4. appointments
Appointment records.
```
- id (UUID, Primary Key)
- business_id (UUID, Foreign Key to profiles)
- service_id (UUID, Foreign Key to services)
- client_id (UUID, Foreign Key to clients)
- scheduled_at (TIMESTAMP)
- status (ENUM: 'pending' | 'confirmed' | 'completed' | 'cancelled')
- notes (TEXT, optional)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Development Rules & Standards

### Code Organization
- **ES Modules Only**: Always use `import`/`export` syntax.
- **Modular Structure**: Separate concerns strictly:
  - `src/modules/` - Business logic (auth, data operations)
  - `src/pages/` - Page-specific UI handlers and event listeners
  - `src/services/` - External service integrations (Supabase, APIs)
  - `src/utils/` - Reusable helper functions and utilities
- **No Page Bundling**: Each HTML page can be accessed independently.

### Frontend Best Practices
- **Responsive Design**: Mobile-first approach. Must work on all screen sizes (320px+).
- **Bootstrap 5 Utilities**: Use Bootstrap classes for styling; minimize custom CSS.
- **Form Validation**: Validate on the client-side before submission. Show clear error messages.
- **Loading States**: Disable form buttons and show spinners during async operations.
- **Error Handling**: Catch and display user-friendly error messages.
- **Accessibility**: Use semantic HTML (`<form>`, `<button>`, `<label>`), proper ARIA labels.

### JavaScript Standards
- Use `const` and `let` (never `var`).
- Use async/await for asynchronous operations.
- Follow naming conventions: camelCase for variables/functions, PascalCase for classes/constructors.
- Add comments for complex logic and functions.
- Keep functions small and focused (single responsibility principle).

### Supabase Integration
- Initialize Supabase client in `src/services/supabase.js`.
- Handle authentication through the `auth` module.
- Always implement Row-Level Security (RLS) policies on all tables.
- Use Supabase Real-Time for real-time updates where applicable.

### Page Development
- Do NOT generate all pages at once.
- Wait for step-by-step instructions for each page.
- Each page should:
  - Import necessary modules and utilities
  - Initialize event listeners on DOM ready
  - Handle authentication checks (redirect unauthenticated users)
  - Display appropriate UI based on user role

## Git Workflow
- Commit after each functional feature is complete.
- Use clear, descriptive commit messages (e.g., "feat: implement appointment booking").
- Branch naming: `feature/feature-name` for new features, `fix/bug-name` for fixes.

## Deployment Notes
- Environment variables (Supabase URL, keys) should be in `.env.local` (not committed).
- Run `npm run build` for production build.
- Serve from `dist/` directory after build.

## Development Commands
```bash
npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

---
**Last Updated**: March 1, 2026
**Status**: In Development (Core Auth & UI Setup Complete, DB Schema & Pages In Progress)
