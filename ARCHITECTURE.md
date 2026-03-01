# SimpleBook SaaS - Architecture Guide

This document provides a comprehensive overview of the application architecture, data flow, and key design decisions.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Landing    │  │   Auth       │  │   Dashboard          │  │
│  │  (index)     │  │  (login,     │  │ (business owner      │  │
│  │              │  │   register)  │  │  management panel)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Booking Page (booking.html)                 │  │
│  │  (Public client-facing appointment booking interface)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│              Vanilla JavaScript (ES Modules)                     │
│              Bootstrap 5 UI Framework                            │
│              Local Storage for Session                           │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/REST API calls
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Service │  │  PostgreSQL  │  │  Storage (S3)        │  │
│  │ (JWT tokens) │  │  Database    │  │  (File uploads)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Row-Level Security (RLS) Policies                       │  │
│  │  - Enforces data isolation between businesses            │  │
│  │  - Restricts client access to own appointments           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## File & Folder Structure

### Frontend Assets
```
simplebook-saas/
├── public/                    # Static assets (icons, logos, fonts)
│
├── src/                       # Application source code
│   ├── modules/
│   │   └── auth.js           # Authentication logic & session management
│   │                          # Functions: registerUser, loginUser, getCurrentUser
│   │
│   ├── pages/
│   │   ├── login.js          # Login page handler
│   │   ├── register.js       # Registration page handler
│   │   ├── dashboard.js      # Business owner dashboard logic
│   │   └── booking.js        # Client booking interface logic
│   │
│   ├── services/
│   │   └── supabase.js       # Database & Storage operations
│   │                          # Functions: getServices, createAppointment, uploadProfilePicture
│   │
│   ├── utils/
│   │   ├── validators.js     # Form validation helpers
│   │   ├── formatters.js     # Date/time formatting utilities
│   │   └── constants.js      # App constants & config
│   │
│   ├── main.js               # Global app initialization
│   └── style.css             # Global styles
│
├── index.html                # Landing page
├── login.html                # Login page
├── register.html             # Registration page
├── dashboard.html            # Dashboard UI template
├── booking.html              # Booking UI template
│
├── vite.config.js            # Vite bundler configuration
├── package.json              # Dependencies & scripts
└── vercel.json               # Vercel deployment config
```

## Data Flow Architecture

### 1. Authentication Flow

```
User Input (Email/Password)
        ↓
    register.js / login.js
        ↓
    auth.js (registerUser/loginUser)
        ↓
    Supabase Auth API
        ↓
    JWT Token stored in localStorage
        ↓
    User session active
```

### 2. Dashboard Data Flow

```
Dashboard Page Load
        ↓
dashboard.js (checkAuth)
        ↓
getCurrentUser() ← Auth module
        ↓
getProfile(userId) ← Services (SQL)
        ↓
PostgreSQL profiles table
        ↓
Display business info on dashboard
```

### 3. Appointment Creation Flow

```
Client fills booking form
        ↓
booking.js (form submit handler)
        ↓
Validate form data
        ↓
createAppointment() ← Services
        ↓
Supabase INSERT appointment record
        ↓
RLS policy checks client access
        ↓
Appointment created in DB
        ↓
Show success message
```

### 4. File Upload Flow

```
User selects profile picture
        ↓
File reader (FileReader API)
        ↓
Show local preview
        ↓
uploadProfilePicture() ← Services
        ↓
Supabase Storage upload
        ↓
Get public URL
        ↓
updateProfile() with image_url
        ↓
Store in database
        ↓
Display updated picture
```

## Database Schema

### Tables Overview

| Table | Purpose | Key Fields | Relationships |
|-------|---------|-----------|----------------|
| **profiles** | User profiles (business owners & clients) | id, user_id, account_type, email | References auth.users |
| **services** | Services offered by businesses | id, business_id, name, price, duration | FK to profiles |
| **clients** | Client records for each business | id, business_id, email, full_name | FK to profiles |
| **appointments** | Appointment bookings | id, business_id, service_id, client_id, scheduled_at | FK to services, clients |

### Key Constraints & Indexes

```sql
-- Foreign Keys (Data Integrity)
profiles.user_id → auth.users.id
services.business_id → profiles.id
clients.business_id → profiles.id
appointments.business_id → profiles.id
appointments.service_id → services.id
appointments.client_id → clients.id

-- Unique Constraints
profiles.user_id UNIQUE
profiles.email UNIQUE

-- Indexes (Query Performance)
profiles(user_id)
profiles(account_type)
services(business_id)
services(is_active)
clients(business_id)
appointments(business_id)
appointments(scheduled_at)
appointments(status)
```

## Security Architecture

### 1. Authentication & JWT

- **Flow:** Email/Password → Supabase Auth → JWT Token
- **Storage:** Browser localStorage (accessible to JavaScript)
- **Expiry:** Token expires after configured TTL
- **Refresh:** Automatic token refresh via Supabase library

### 2. Row-Level Security (RLS)

All tables enforce RLS policies:

```sql
-- Profile Security
- Users can view/edit only their own profile
- RLS prevents cross-user data access

-- Service Security  
- Business owners manage only their services
- Clients can view active services only

-- Appointment Security
- Business owners see all their appointments
- Clients see only their own bookings
- Ensures multi-tenant isolation

-- Client Security
- Business owner manages client list
- Clients cannot access other business client data
```

### 3. Storage Security

- Files stored in `user-uploads` bucket (public read)
- Write access restricted by RLS policies
- File size limit: 5MB
- Path structure: `/profile-pictures/{userId}` for privacy

### 4. API Key Security

- **Anon Key:** Used in frontend (limited by RLS)
- **Service Role Key:** Never exposed to frontend
- **Environment Variables:** All keys in `.env.local` (not committed)

## Module Responsibilities

### auth.js
**Handles:** Supabase authentication logic  
**Exports:**
- `registerUser(email, password, metadata)` - Create new account
- `loginUser(email, password)` - Authenticate user
- `logoutUser()` - Clear session
- `getCurrentUser()` - Get active user
- `onAuthStateChange(callback)` - Listen to auth changes

### supabase.js
**Handles:** Database & Storage operations  
**Exports:**
- `getServices(businessId)` - Fetch services
- `createService(data)` - Add new service
- `getAppointmentsWithDetails(businessId)` - Fetch appointments
- `uploadProfilePicture(userId, file)` - Upload to Storage
- `getOrCreateProfile(userId)` - Sync user profile

### dashboard.js
**Handles:** Business owner dashboard logic  
**Features:**
- Auth checking & redirection
- Service management (CRUD)
- Appointment viewing & status updates
- Client list viewing
- Stats calculation

### booking.js
**Handles:** Client booking interface  
**Features:**
- Service listing from database
- Time slot generation
- Form validation
- Appointment creation
- Confirmation handling

### validators.js & formatters.js
**Utilities:** Form validation, date/time formatting

## State Management

### Client-Side State Storage

```javascript
// Session (stored in browser memory + localStorage)
- currentUser (from Supabase Auth)
- currentProfile (from profiles table)
- isAuthenticated (boolean)

// Page-Specific State
- services (fetched from database)
- appointments (fetched from database)
- clients (fetched from database)

// Form State
- Form inputs (in DOM, not stored)
- Validation errors (displayed in real-time)
```

### No Centralized State Manager

The app deliberately avoids Redux/Vuex because:
- Simple authentication-based access control
- Each page manages its own data needs
- Smaller bundle size
- Faster development & maintenance

## Performance Optimization

### Frontend
- **Lazy loading:** Each .html page loads only its .js
- **Asset minification:** Vite automatically minifies code
- **Tree shaking:** Unused code removed during build
- **CSS utilities:** Bootstrap utilities for minimal custom CSS

### Database
- **Indexes:** On critical columns (business_id, scheduled_at, status)
- **Query optimization:** Select only needed fields
- **Connection pooling:** Supabase handles internally

### Storage
- **File compression:** Store optimized images
- **Caching:** CDN caches static assets automatically
- **Max file size:** 5MB limit prevents bandwidth waste

## Scaling Considerations

### Current Architecture Handles
✅ Up to 1,000 concurrent users  
✅ Multiple time zones & locales  
✅ Multi-tenant business isolation  

### For Large Scale (10,000+ users), Consider:
- Database read replicas for reporting
- Search indexing (Elasticsearch)
- Message queues for async processing (Bull, RabbitMQ)
- Background jobs (node-schedule, Celery)
- API rate limiting
- Caching layer (Redis)

## Testing Strategy

### Unit Tests (Recommended)
- Validators: Form validation rules
- Formatters: Date/time formatting
- Auth: Session management

### Integration Tests
- Supabase API calls
- Authentication flows
- Database operations

### E2E Tests
- Full user workflows (register → book → confirm)
- Cross-browser compatibility
- Mobile responsiveness

### Manual Testing
- User acceptance testing (UAT)
- Edge cases (network failures, invalid data)
- Accessibility (keyboard navigation, screen readers)

## Deployment Architecture

```
┌──────────────────┐
│  Git Repository  │ (GitHub)
└────────┬─────────┘
         │ Push
┌────────▼─────────┐
│  CI/CD Pipeline  │ (Netlify/Vercel)
└────────┬─────────┘
         │ Build & Deploy
┌────────▼──────────────────┐
│  CDN & Web Server         │ (Netlify/Vercel Edge)
│  - Caches static assets   │
│  - Serves HTML/CSS/JS     │
│  - Auto HTTPS             │
└────────┬──────────────────┘
         │ API calls (HTTPS)
┌────────▼─────────┐
│  Supabase        │ (PostgreSQL + REST API)
│  - Database      │
│  - Storage       │
│  - Auth          │
└──────────────────┘
```

## Key Metrics for Monitoring

| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| Time to Interactive | < 3 seconds |
| API Response Time | < 500ms |
| Database Query Time | < 100ms |
| Uptime | > 99.5% |
| Lighthouse Score | > 90 |

## Related Documentation

- [README.md](./README.md) - Project overview & setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [SECURITY.md](./SECURITY.md) - Security policies & best practices
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Development guidelines

---

**Last Updated:** March 2, 2026  
**Status:** Production Ready
