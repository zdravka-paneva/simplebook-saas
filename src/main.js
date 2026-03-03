import './style.css'
import { getCurrentUser, logoutUser } from './modules/auth.js'

// SimpleBook SaaS - Multi-page Application
// Runs on index.html - updates navbar based on auth state

function applyClientContent(user) {
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'

  // ── Hero ──────────────────────────────────────────────────────────
  const hero = document.getElementById('heroSection')
  if (hero) {
    hero.innerHTML = `
    <div class="container py-5">
      <div class="row align-items-center">
        <div class="col-lg-6 mb-4 mb-lg-0">
          <h1 class="display-4 fw-bold mb-4">Welcome back, ${firstName}! 👋</h1>
          <p class="lead mb-4">Discover local businesses, choose a service, and book your next appointment in seconds — completely free.</p>
          <div class="d-flex gap-3 flex-wrap">
            <a href="my-bookings.html#discover" class="btn btn-warning btn-lg fw-bold">🔍 Discover Businesses</a>
            <a href="my-bookings.html" class="btn btn-outline-light btn-lg fw-bold">📋 My Bookings</a>
          </div>
          <p class="mt-4 small">✓ Free forever for clients &nbsp;•&nbsp; ✓ Instant booking &nbsp;•&nbsp; ✓ No phone calls needed</p>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-lg p-4" style="background: rgba(255,255,255,0.95);">
            <div class="card-body text-dark">
              <h5 class="card-title mb-3">Your Recent Bookings</h5>
              <p class="text-muted small mb-3">Check your upcoming appointments and manage everything from one place.</p>
              <a href="my-bookings.html" class="btn btn-primary w-100 fw-medium">📅 Open My Bookings</a>
            </div>
          </div>
        </div>
      </div>
    </div>`
  }

  // ── Features ──────────────────────────────────────────────────────
  const features = document.querySelector('[data-section="features"]')
  if (features) {
    features.innerHTML = `
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">Everything You Need to Book Smarter</h2>
        <p class="lead text-muted">Your personal booking hub — discover, book, and manage appointments with ease</p>
      </div>
      <div class="row g-4">
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="mb-3" style="font-size:3rem;">🔍</div>
              <h5 class="card-title fw-bold">Discover Businesses</h5>
              <p class="card-text text-muted">Browse salons, spas, clinics, gyms and more by type or city. Find the right provider in seconds.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="mb-3" style="font-size:3rem;">📅</div>
              <h5 class="card-title fw-bold">Instant Booking</h5>
              <p class="card-text text-muted">Book an appointment in a few clicks — no phone calls, no waiting on hold, no back-and-forth.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="mb-3" style="font-size:3rem;">⭐</div>
              <h5 class="card-title fw-bold">Save Favourites</h5>
              <p class="card-text text-muted">Star businesses you love to quickly rebook next time — your go-to places always one tap away.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="mb-3" style="font-size:3rem;">🗂️</div>
              <h5 class="card-title fw-bold">Manage Appointments</h5>
              <p class="card-text text-muted">View all your upcoming and past appointments in one dashboard. Cancel at any time with a single click.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="mb-3" style="font-size:3rem;">📱</div>
              <h5 class="card-title fw-bold">Book from Anywhere</h5>
              <p class="card-text text-muted">Fully responsive on any smartphone, tablet or desktop — book on the go, whenever it suits you.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center">
              <div class="mb-3" style="font-size:3rem;">🔒</div>
              <h5 class="card-title fw-bold">Secure & Private</h5>
              <p class="card-text text-muted">Your personal data is encrypted and never shared. You stay in full control of your booking information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>`
  }

  // ── How It Works ──────────────────────────────────────────────────
  const how = document.getElementById('howItWorksSection')
  if (how) {
    how.innerHTML = `
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="display-5 fw-bold mb-3">How It Works</h2>
        <p class="lead text-muted">From discovery to confirmation in four easy steps</p>
      </div>
      <div class="row g-4">
        <div class="col-md-6 col-lg-3">
          <div class="text-center">
            <div class="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width:60px;height:60px;font-size:1.5rem;">1</div>
            <h5 class="fw-bold">Find a Business</h5>
            <p class="text-muted small">Browse businesses by type or city on the Discover tab</p>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="text-center">
            <div class="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width:60px;height:60px;font-size:1.5rem;">2</div>
            <h5 class="fw-bold">Pick a Service</h5>
            <p class="text-muted small">Choose from their available services and pick a date & time</p>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="text-center">
            <div class="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width:60px;height:60px;font-size:1.5rem;">3</div>
            <h5 class="fw-bold">Confirm Booking</h5>
            <p class="text-muted small">Enter your details and submit — instant confirmation awaits</p>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="text-center">
            <div class="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width:60px;height:60px;font-size:1.5rem;">4</div>
            <h5 class="fw-bold">Show Up & Enjoy</h5>
            <p class="text-muted small">Track your appointment and arrive knowing everything is ready</p>
          </div>
        </div>
      </div>
    </div>`
  }

  // ── CTA ───────────────────────────────────────────────────────────
  const cta = document.getElementById('ctaSection')
  if (cta) {
    cta.innerHTML = `
    <div class="container text-center">
      <h2 class="display-5 fw-bold mb-4">Ready to Book Your Next Appointment?</h2>
      <p class="lead mb-4">Discover hundreds of businesses on SimpleBook — all free for clients, forever.</p>
      <a href="my-bookings.html#discover" class="btn btn-light btn-lg fw-bold px-5">🔍 Browse Businesses</a>
    </div>`
  }
}

async function updateNavForAuth() {
  const user = await getCurrentUser()

  const navLoginLink = document.getElementById('navLoginLink')
  const navSignupLink = document.getElementById('navSignupLink')
  const navDashboardLink = document.getElementById('navDashboardLink')
  const navLogoutLink = document.getElementById('navLogoutLink')
  const navDashboardAnchor = document.getElementById('navDashboardAnchor')

  if (!navLoginLink) return // not on index.html

  if (user) {
    // Hide login/signup, show dashboard/logout
    navLoginLink.classList.add('d-none')
    navSignupLink.classList.add('d-none')
    navDashboardLink.classList.remove('d-none')
    navLogoutLink.classList.remove('d-none')

    // Adjust dashboard link based on account type
    const accountType = user.user_metadata?.account_type
    if (accountType === 'business') {
      navDashboardAnchor.href = 'dashboard.html'
      navDashboardAnchor.textContent = '📊 Dashboard'
    } else if (accountType === 'admin') {
      navDashboardAnchor.href = 'admin.html'
      navDashboardAnchor.textContent = '🔧 Admin'
    } else {
      navDashboardAnchor.href = 'my-bookings.html'
      navDashboardAnchor.textContent = '📅 My Bookings'
      // Pricing is for business subscriptions — hide it for clients
      document.getElementById('navPricingLink')?.classList.add('d-none')
      // Swap page content to client-relevant messaging
      applyClientContent(user)
    }

    // Logout handler
    document.getElementById('navLogoutBtn').addEventListener('click', async (e) => {
      e.preventDefault()
      await logoutUser()
      window.location.reload()
    })
  }
}

updateNavForAuth()
console.log('SimpleBook SaaS - Ready!')
