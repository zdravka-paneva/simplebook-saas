# Contributing to SimpleBook SaaS

Thank you for your interest in contributing to SimpleBook! This document provides guidelines for developing features, reporting bugs, and submitting pull requests.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Messages](#commit-messages)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors must:
- ✅ Be respectful and inclusive
- ✅ Welcome feedback and constructive criticism
- ✅ Focus on code quality, not personal attacks
- ✅ Follow all guidelines in this document

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- GitHub account
- Supabase account (for testing)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourname/simplebook-saas.git
cd simplebook-saas

# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Project Structure Quick Guide

```
src/
├── modules/auth.js          ← Authentication logic
├── pages/                   ← Page handlers (login, register, dashboard, booking)
├── services/supabase.js     ← Database & API operations
└── utils/                   ← Helpers (validators, formatters, constants)
```

Detailed structure: See [ARCHITECTURE.md](./ARCHITECTURE.md)

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
# or for bugfixes
git checkout -b fix/your-bug-name

# Branch naming convention:
# feature/add-email-notifications
# fix/undefined-service-error
# docs/update-readme
# test/add-dashboard-tests
```

### 2. Make Changes

Follow the [Coding Standards](#coding-standards) below.

**Example: Adding a new function to supabase.js**

```javascript
/**
 * Get all services with pagination
 * @param {string} businessId - Business ID
 * @param {number} page - Page number (starts at 1)
 * @param {number} limit - Items per page
 * @returns {Promise<Array>} Services array
 */
export async function getServicesPaginated(businessId, page = 1, limit = 10) {
  const offset = (page - 1) * limit
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}
```

### 3. Test Locally

```bash
# Run dev server
npm run dev

# Test your changes in browser
# Check console for errors (F12 → Console)
# Test functionality manually

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Commit Changes

```bash
# Check what changed
git status

# Stage changes
git add src/services/supabase.js

# Or stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: add pagination to service listing"
```

See [Commit Messages](#commit-messages) below for format.

### 5. Push and Create Pull Request

```bash
# Push branch to GitHub
git push origin feature/your-feature-name

# Go to GitHub and click "Create Pull Request"
```

## Coding Standards

### JavaScript/ES Modules

```javascript
// ✅ DO: Use const and let
const userName = "John"
let count = 0

// ❌ DON'T: Use var
var oldVariable = "outdated"

// ✅ DO: Use async/await
async function fetchData() {
  const result = await getData()
  return result
}

// ❌ DON'T: Use .then() chains
getData().then(result => console.log(result))

// ✅ DO: Use arrow functions for callbacks
users.map(user => user.name)
button.addEventListener('click', () => handleClick())

// ❌ DON'T: Use function expressions
users.map(function(user) { return user.name })

// ✅ DO: Always add JSDoc comments
/**
 * Calculate total appointment value
 * @param {number} price - Service price
 * @param {number} duration - Duration in minutes
 * @returns {number} Total value
 */
function calculateValue(price, duration) {
  return (price / 60) * duration
}

// ❌ DON'T: No documentation
function calc(p, d) { ... }

// ✅ DO: Handle errors with try/catch
try {
  await createAppointment(data)
} catch (error) {
  console.error('Failed to create appointment:', error)
  showErrorMessage(error.message)
}

// ❌ DON'T: Ignore errors
await createAppointment(data)
```

### HTML

```html
<!-- ✅ DO: Use semantic HTML -->
<form id="loginForm">
  <label for="email">Email</label>
  <input type="email" id="email" required>
  <button type="submit">Login</button>
</form>

<!-- ❌ DON'T: Divs for everything -->
<div id="form">
  <div>Email</div>
  <div><input type="text"></div>
  <div onclick="login()">Login</div>
</div>

<!-- ✅ DO: Bootstrap utility classes -->
<div class="card shadow-sm mb-4">
  <h5 class="card-title fw-bold">Services</h5>
</div>

<!-- ❌ DON'T: Custom CSS for everything -->
<div style="box-shadow: 0 1px 3px; margin-bottom: 20px;">
  <h5 style="font-weight: bold;">Services</h5>
</div>
```

### CSS

```css
/* ✅ DO: Use Bootstrap variables */
.btn-primary {
  background-color: var(--bs-primary);
}

/* ✅ DO: BEM naming for custom CSS */
.card__header { ... }
.card__body { ... }

/* ❌ DON'T: Generic names */
.title { ... }
.box { ... }

/* ✅ DO: Mobile-first responsive design */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

/* ❌ DON'T: Start with desktop */
@media (max-width: 768px) {
  .container {
    max-width: 100%;
  }
}
```

### File Naming

```
// JavaScript files
src/modules/auth.js
src/pages/dashboard.js
src/services/supabase.js
src/utils/validators.js

// HTML files (lowercase, hyphens for multi-word)
index.html
login.html
register.html
booking.html
service-detail.html

// CSS files
style.css
dark-theme.css
```

## Commit Messages

Use clear, descriptive commit messages following the conventional commits format:

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, missing semicolons)
- `refactor` - Code refactoring without behavior change
- `test` - Test additions/modifications
- `build` - Build tool or dependency changes
- `chore` - Maintenance, version bumps

### Examples

```bash
# Feature
git commit -m "feat: add profile picture upload to dashboard"

# Bug fix
git commit -m "fix: prevent undefined error when service has no description"

# Documentation
git commit -m "docs: add deployment guide for Vercel"

# With description
git commit -m "feat: add pagination to service listings

- Add page parameter to getServices
- Implement pagination UI in dashboard
- Default to 10 items per page
- Fixes #123"

# Reference issue
git commit -m "fix: create appointment status not updating

This fixes the issue where appointment status was not being saved
to the database after clicking 'Confirm'.

Fixes #456"
```

## Pull Request Process

### Before Submitting

1. **Update main branch**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Test your changes**
   - [ ] Run `npm run dev` and test in browser
   - [ ] Check console for errors (F12)
   - [ ] Test on mobile (DevTools device emulation)
   - [ ] Run `npm run build` (no errors)

3. **Run code quality checks**
   ```bash
   npm audit  # Check for vulnerabilities
   ```

4. **Ensure proper documentation**
   - [ ] Updated README.md if needed
   - [ ] Added JSDoc comments to functions
   - [ ] Updated ARCHITECTURE.md if architecture changed

### Pull Request Template

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Fixes #123 (IssueNumber)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Breaking change

## Changes Made
- Item 1
- Item 2
- Item 3

## Testing
How did you test these changes?
- [ ] Manual testing on localhost
- [ ] Tested on mobile
- [ ] All existing features still work

## Screenshots (if applicable)
Include screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### After Submitting

- Respond to code review comments
- Make requested changes in new commits
- Request re-review when changes complete

## Testing

### Unit Testing (to add)

```javascript
// test/validators.test.js
import { validateEmail } from '../src/utils/validators.js'

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false)
  })
})
```

### Manual Testing Checklist

**For Features:**
- [ ] Feature works as described
- [ ] No console errors
- [ ] No regressions in existing features
- [ ] Mobile-responsive
- [ ] Accessible (test with keyboard navigation)

**For Bug Fixes:**
- [ ] Bug is fixed
- [ ] Root cause addressed
- [ ] No new issues introduced
- [ ] Edge cases considered

## Documentation

### What Needs Documentation

✅ New features (update README.md)  
✅ API changes (update ARCHITECTURE.md)  
✅ Configuration changes (update deployment docs)  
✅ Complex logic (JSDoc comments)  
✅ Security changes (update SECURITY.md)  

### Documentation Format

**Code comments:**
```javascript
/**
 * Short description
 * 
 * Longer description if needed
 * Can span multiple lines
 * 
 * @param {type} name - Parameter description
 * @returns {type} Return value description
 * @throws {Error} When something goes wrong
 */
function doSomething(name) { ... }
```

**Markdown files:**
- Use clear headings
- Include code examples
- Use `✅` and `❌` for good/bad examples
- Keep lines < 100 characters

## Review Process

### Code Review Checklist

1. **Code Quality**
   - [ ] Follows coding standards
   - [ ] Properly documented
   - [ ] No debugging code left in

2. **Functionality**
   - [ ] Solves the issue/implements feature
   - [ ] No regressions
   - [ ] Edge cases handled

3. **Security**
   - [ ] No secrets exposed
   - [ ] Input validated
   - [ ] RLS policies respected

4. **Performance**
   - [ ] No unnecessary renders
   - [ ] Efficient database queries
   - [ ] No memory leaks

## Common Issues & Solutions

### Issue: "npm ERR! code ENOENT"
**Solution:** Run `npm install` to restore dependencies

### Issue: "Module not found" error
**Solution:** Check import paths match file locations

### Issue: "Port 5173 already in use"
**Solution:** Kill existing process or use different port

```bash
# Kill on Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Kill on macOS/Linux
lsof -i :5173
kill <PID>
```

### Issue: Git merge conflicts
**Solution:**
```bash
git fetch origin
git rebase origin/main
# Resolve conflicts in editor
git rebase --continue
git push -f origin feature/your-branch
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub Release with release notes

## Questions or Need Help?

- 📖 Read [README.md](./README.md) for setup
- 🏗️ Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- 🔐 Review [SECURITY.md](./SECURITY.md) for security guidance
- 📝 See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment info
- 💬 Open a GitHub Issue for questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to SimpleBook SaaS! 🎉**

Last Updated: March 2, 2026
