import { getCurrentUser, logoutUser } from '../modules/auth.js'
import {
  getClientAppointments,
  cancelAppointment,
  getFavorites,
  addFavorite,
  removeFavorite,
  getProfile,
  getBusinessProfiles,
  supabase
} from '../services/supabase.js'

let allAppointments   = []
let allFavorites      = []  // rows from favorites table with joined profiles
let currentFilter     = 'all'
let pendingCancelId   = null
let currentProfile    = null  // logged-in client's profiles row

// Discover state
let allBusinesses     = []   // cached full list from DB
let discoverLoaded    = false
let discoverTimer     = null // debounce handle

// ──────────────────────────────────────────────
// Notification helpers (persisted in localStorage)
// ──────────────────────────────────────────────
const NOTIF_KEY = 'sb_notifications'

function loadNotifications() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || [] }
  catch { return [] }
}

function saveNotifications(list) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list))
}

function pushNotification({ icon, title, body, apptId }) {
  const list = loadNotifications()
  list.unshift({ id: Date.now(), icon, title, body, apptId, read: false, at: new Date().toISOString() })
  // Keep max 30
  saveNotifications(list.slice(0, 30))
  renderNotifDrawer()
  updateNotifBadge()
}

function markAllRead() {
  const list = loadNotifications().map(n => ({ ...n, read: true }))
  saveNotifications(list)
  renderNotifDrawer()
  updateNotifBadge()
}

function dismissNotification(id) {
  const list = loadNotifications().filter(n => n.id !== id)
  saveNotifications(list)
  renderNotifDrawer()
  updateNotifBadge()
}

function updateNotifBadge() {
  const unread = loadNotifications().filter(n => !n.read).length
  const badge = document.getElementById('notifBadge')
  if (!badge) return
  if (unread > 0) {
    badge.textContent = unread > 9 ? '9+' : unread
    badge.classList.remove('d-none')
  } else {
    badge.classList.add('d-none')
  }
}

function renderNotifDrawer() {
  const list = loadNotifications()
  const container = document.getElementById('notifList')
  const empty = document.getElementById('notifEmpty')
  if (!container) return

  if (list.length === 0) {
    empty.style.display = 'block'
    // Remove any existing cards
    container.querySelectorAll('.notif-item').forEach(el => el.remove())
    return
  }
  empty.style.display = 'none'

  // Re-render all items
  container.querySelectorAll('.notif-item').forEach(el => el.remove())
  list.forEach(n => {
    const div = document.createElement('div')
    div.className = `notif-item card border-0 mb-2 shadow-sm ${n.read ? 'opacity-75' : ''}`
    div.style.cssText = `border-left: 4px solid ${n.read ? '#dee2e6' : '#0066cc'} !important; border-radius:10px;`
    div.innerHTML = `
      <div class="card-body py-2 px-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div class="d-flex gap-2 align-items-start">
            <span style="font-size:1.3rem;line-height:1.4;">${n.icon}</span>
            <div>
              <div class="fw-semibold small">${n.title}</div>
              <div class="text-muted" style="font-size:.8rem;">${n.body}</div>
              <div class="text-muted mt-1" style="font-size:.7rem;">${new Date(n.at).toLocaleString()}</div>
            </div>
          </div>
          <button class="btn-close flex-shrink-0" style="font-size:.65rem;" data-notif-id="${n.id}" title="Dismiss"></button>
        </div>
      </div>`
    div.querySelector('.btn-close').addEventListener('click', () => dismissNotification(n.id))
    container.appendChild(div)
  })
}

function openNotifDrawer() {
  const drawer = document.getElementById('notifDrawer')
  const backdrop = document.getElementById('notifBackdrop')
  drawer.style.display = 'flex'
  backdrop.style.display = 'block'
  // Trigger animation next frame
  requestAnimationFrame(() => { drawer.style.transform = 'translateX(0)' })
  // Mark all as read after 1 second
  setTimeout(() => { markAllRead() }, 1000)
}

function closeNotifDrawer() {
  const drawer = document.getElementById('notifDrawer')
  const backdrop = document.getElementById('notifBackdrop')
  drawer.style.transform = 'translateX(100%)'
  backdrop.style.display = 'none'
  setTimeout(() => { drawer.style.display = 'none' }, 260)
}

function wireNotifDrawer() {
  document.getElementById('notifBell')?.addEventListener('click', openNotifDrawer)
  document.getElementById('closeNotifDrawer')?.addEventListener('click', closeNotifDrawer)
  document.getElementById('notifBackdrop')?.addEventListener('click', closeNotifDrawer)
  document.getElementById('markAllReadBtn')?.addEventListener('click', () => { markAllRead(); updateNotifBadge() })
}

// ──────────────────────────────────────────────
// Bootstrap instances (lazy initialized)
// ──────────────────────────────────────────────
let cancelModal = null
let toast       = null

function getCancelModal() {
  if (!cancelModal) cancelModal = new bootstrap.Modal(document.getElementById('cancelModal'))
  return cancelModal
}
function getToast() {
  if (!toast) toast = new bootstrap.Toast(document.getElementById('toastMsg'), { delay: 3000 })
  return toast
}

// ──────────────────────────────────────────────
// Toast helper
// ──────────────────────────────────────────────
function showToast(message, type = 'success') {
  const el = document.getElementById('toastMsg')
  const colors = { success: 'bg-success', danger: 'bg-danger', info: 'bg-primary' }
  el.className = `toast align-items-center text-white border-0 ${colors[type] || 'bg-primary'}`
  document.getElementById('toastText').textContent = message
  getToast().show()
}

// ──────────────────────────────────────────────
// Auth guard
// ──────────────────────────────────────────────
async function checkAuth() {
  const user = await getCurrentUser()
  if (!user) {
    window.location.href = 'login.html'
    return null
  }
  const type = user.user_metadata?.account_type
  if (type === 'business') { window.location.href = 'dashboard.html'; return null }
  if (type === 'admin')    { window.location.href = 'admin.html';    return null }
  return user
}

// ──────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  })
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
function isUpcoming(iso) {
  return new Date(iso) > new Date()
}
function statusBadge(status) {
  const map = {
    pending:   { cls: 'status-pending',   icon: '🕐', label: 'Pending' },
    confirmed: { cls: 'status-confirmed', icon: '✅', label: 'Confirmed' },
    completed: { cls: 'status-completed', icon: '🎉', label: 'Completed' },
    cancelled: { cls: 'status-cancelled', icon: '❌', label: 'Cancelled' },
  }
  const s = map[status] || map.pending
  return `<span class="badge rounded-pill px-3 py-2 ${s.cls}">${s.icon} ${s.label}</span>`
}

// ──────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────
function updateStats() {
  const now = new Date()
  document.getElementById('statUpcoming').textContent  =
    allAppointments.filter(a => new Date(a.scheduled_at) > now && a.status !== 'cancelled').length
  document.getElementById('statPending').textContent   =
    allAppointments.filter(a => a.status === 'pending').length
  document.getElementById('statCompleted').textContent =
    allAppointments.filter(a => a.status === 'completed').length
  document.getElementById('statCancelled').textContent =
    allAppointments.filter(a => a.status === 'cancelled').length
}

// ──────────────────────────────────────────────
// Favorites (DB-backed)
// ──────────────────────────────────────────────
function isFav(bizId) { return allFavorites.some(f => f.business_profile_id === bizId) }

async function toggleFav(bizId, bizName) {
  if (!currentProfile) { showToast('Please log in to save favorites', 'warning'); return }
  try {
    if (isFav(bizId)) {
      await removeFavorite(currentProfile.id, bizId)
      allFavorites = allFavorites.filter(f => f.business_profile_id !== bizId)
      showToast('Removed from favorites', 'info')
    } else {
      await addFavorite(currentProfile.id, bizId)
      allFavorites = await getFavorites()  // reload to get joined data
      showToast(`⭐ ${bizName} saved to favorites!`, 'success')
    }
    renderAppointments()
    renderFavorites()
  } catch (err) {
    console.error('Favorite toggle failed:', err)
    showToast('Failed to update favorites', 'danger')
  }
}

// ──────────────────────────────────────────────
// Appointments rendering
// ──────────────────────────────────────────────
function getFiltered() {
  const now = new Date()
  if (currentFilter === 'all')      return allAppointments
  if (currentFilter === 'upcoming') return allAppointments.filter(a => new Date(a.scheduled_at) > now && a.status !== 'cancelled')
  return allAppointments.filter(a => a.status === currentFilter)
}

function renderAppointments() {
  const list    = document.getElementById('appointmentsList')
  const empty   = document.getElementById('appointmentsEmpty')
  const loading = document.getElementById('appointmentsLoading')
  loading.style.display = 'none'

  const filtered = getFiltered()
  if (filtered.length === 0) {
    list.style.display  = 'none'
    empty.style.display = 'block'
    return
  }
  empty.style.display = 'none'
  list.style.display  = 'block'

  list.innerHTML = filtered.map(appt => {
    const biz       = appt.profiles || {}
    const service   = appt.services  || {}
    const bizId     = biz.id || appt.business_id
    const canCancel = (appt.status === 'pending' || appt.status === 'confirmed') && isUpcoming(appt.scheduled_at)
    const faved     = isFav(bizId)
    const bookUrl   = `booking.html?business=${bizId}`

    return `
    <div class="card border-0 shadow-sm appointment-card mb-3">
      <div class="card-body p-4">
        <div class="row align-items-center g-3">
          <div class="col-12 col-md-4">
            <div class="d-flex align-items-center gap-3">
              <div class="flex-shrink-0">
                ${biz.business_image_url
                  ? `<img src="${biz.business_image_url}" class="rounded-3" style="width:58px;height:58px;object-fit:cover;" alt="" loading="lazy">`
                  : `<div class="rounded-3 d-flex align-items-center justify-content-center fw-bold text-white" style="width:58px;height:58px;font-size:1.4rem;background:linear-gradient(135deg,#0066cc,#004299);">${(biz.business_name||'B')[0].toUpperCase()}</div>`}
              </div>
              <div>
                <div class="fw-bold">${biz.business_name || 'Business'}</div>
                <div class="small text-muted">${biz.business_type || ''}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="fw-medium mb-1">💅 ${service.name || 'Service'}</div>
            <div class="small text-muted mb-1">📅 ${formatDate(appt.scheduled_at)} at ${formatTime(appt.scheduled_at)}</div>
            <div class="small text-muted">⏱ ${service.duration_minutes || '—'} min &nbsp;·&nbsp; 💰 $${parseFloat(service.price || 0).toFixed(2)}</div>
          </div>
          <div class="col-12 col-md-4 d-flex flex-column align-items-md-end gap-2">
            ${statusBadge(appt.status)}
            <div class="d-flex gap-2 mt-1 flex-wrap justify-content-md-end">
              <a href="${bookUrl}" class="btn btn-sm btn-outline-primary">📝 Book Again</a>
              <button class="btn btn-sm ${faved ? 'btn-warning' : 'btn-outline-secondary'} fav-btn"
                      data-biz-id="${bizId}"
                      data-biz-name="${biz.business_name || 'Business'}"
                      title="${faved ? 'Remove from favorites' : 'Save as favorite'}">
                ${faved ? '⭐' : '☆'}
              </button>
              ${canCancel ? `<button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${appt.id}">Cancel</button>` : ''}
            </div>
          </div>
        </div>
        ${appt.notes ? `<div class="mt-3 small text-muted border-top pt-3">📝 ${appt.notes}</div>` : ''}
      </div>
    </div>`
  }).join('')

  list.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => { pendingCancelId = btn.dataset.id; getCancelModal().show() })
  })
  list.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleFav(btn.dataset.bizId, btn.dataset.bizName))
  })
}

function renderFavorites() {
  const container = document.getElementById('favoritesList')
  const empty     = document.getElementById('favoritesEmpty')
  if (allFavorites.length === 0) {
    container.innerHTML = ''
    empty.style.display = 'block'
    return
  }
  empty.style.display = 'none'
  container.innerHTML = `
    <div class="row g-3">
      ${allFavorites.map(fav => {
        const biz    = fav.profiles || {}
        const bizId  = fav.business_profile_id
        const bookUrl = `booking.html?business=${bizId}`

        const coverImg = biz.business_image_url
          ? `<img src="${biz.business_image_url}" alt="${biz.business_name}" style="width:100%;height:140px;object-fit:cover;" loading="lazy">`
          : `<div style="width:100%;height:140px;background:linear-gradient(135deg,#fff8e1 0%,#ffe082 100%);display:flex;align-items:center;justify-content:center;font-size:3rem;">\uD83C\uDFE2</div>`

        return `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card border-0 shadow-sm fav-card h-100" style="border-radius:14px;overflow:hidden;">
            <div class="position-relative">
              ${coverImg}
              <span class="position-absolute badge px-2 py-1" style="top:10px;left:10px;background:rgba(0,0,0,.5);color:#fff;font-size:.7rem;border-radius:20px;">${biz.business_type || ''}</span>
            </div>
            <div class="card-body p-3 d-flex flex-column">
              <div class="fw-bold mb-3">${biz.business_name || 'Business'}</div>
              <div class="mt-auto d-flex gap-2">
                <a href="${bookUrl}" class="btn btn-primary btn-sm flex-grow-1 fw-medium" style="border-radius:8px;">\uD83D\uDCC5 Book Now</a>
                <button class="btn btn-outline-danger btn-sm remove-fav-btn"
                        data-biz-id="${bizId}"
                        data-biz-name="${biz.business_name || ''}"
                        title="Remove from favorites" style="border-radius:8px;">\u2B50</button>
              </div>
            </div>
          </div>
        </div>`
      }).join('')}
    </div>`
  container.querySelectorAll('.remove-fav-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleFav(btn.dataset.bizId, btn.dataset.bizName))
  })
}

// ──────────────────────────────────────────────
// Tab switching
// ──────────────────────────────────────────────
window.switchTab = function(tab) {
  const tabs = ['appointments', 'favorites', 'discover']
  tabs.forEach(t => {
    const section = document.getElementById(`section${t.charAt(0).toUpperCase() + t.slice(1)}`)
    const btn     = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`)
    if (section) section.style.display = t === tab ? 'block' : 'none'
    if (btn)     btn.classList.toggle('active', t === tab)
  })
  // Lazy-load businesses the first time Discover tab is opened
  if (tab === 'discover' && !discoverLoaded) loadDiscover()
  // Update URL hash for deep-linking without page reload
  history.replaceState(null, '', `#${tab}`)
}

// ──────────────────────────────────────────────
// Discover: load + render
// ──────────────────────────────────────────────
async function loadDiscover() {
  discoverLoaded = true
  document.getElementById('discoverLoading').style.display = 'block'
  document.getElementById('discoverGrid').style.display    = 'none'
  document.getElementById('discoverEmpty').style.display   = 'none'
  try {
    allBusinesses = await getBusinessProfiles()
    renderDiscover()
  } catch (err) {
    console.error('Failed to load businesses:', err)
    document.getElementById('discoverLoading').innerHTML =
      `<div class="alert alert-danger">Failed to load businesses. <a href="" onclick="location.reload()">Retry</a></div>`
  }
}

function renderDiscover() {
  const search = (document.getElementById('discoverSearch')?.value || '').toLowerCase().trim()
  const type   = document.querySelector('.biz-type-chip.active')?.dataset.type || ''
  const city   = document.getElementById('discoverCity')?.value || ''

  const filtered = allBusinesses.filter(b => {
    const matchType   = !type   || b.business_type === type
    const matchCity   = !city   || b.city === city
    const matchSearch = !search ||
      (b.business_name || '').toLowerCase().includes(search) ||
      (b.business_description || '').toLowerCase().includes(search)
    return matchType && matchCity && matchSearch
  })

  const loading = document.getElementById('discoverLoading')
  const grid    = document.getElementById('discoverGrid')
  const empty   = document.getElementById('discoverEmpty')
  const count   = document.getElementById('discoverCount')

  loading.style.display = 'none'
  count.textContent     = filtered.length ? `${filtered.length} business${filtered.length !== 1 ? 'es' : ''} found` : ''

  if (filtered.length === 0) {
    grid.style.display  = 'none'
    empty.style.display = 'block'
    return
  }
  empty.style.display = 'none'
  grid.style.display  = 'flex'

  grid.innerHTML = filtered.map(biz => {
    const faved    = isFav(biz.id)
    const bookUrl  = `booking.html?business=${biz.id}`
    const descSnippet = biz.business_description
      ? biz.business_description.slice(0, 90) + (biz.business_description.length > 90 ? '\u2026' : '')
      : ''

    const coverImg = biz.business_image_url
      ? `<img src="${biz.business_image_url}" alt="${biz.business_name}" style="width:100%;height:160px;object-fit:cover;" loading="lazy">`
      : `<div style="width:100%;height:160px;background:linear-gradient(135deg,#e8f0fe 0%,#c5d8ff 100%);display:flex;align-items:center;justify-content:center;font-size:3rem;">\uD83C\uDFE2</div>`

    return `
    <div class="col-12 col-sm-6 col-xl-4">
      <div class="card border-0 shadow-sm biz-card h-100" style="border-radius:14px;overflow:hidden;">
        <!-- Cover image -->
        <div class="position-relative">
          ${coverImg}
          <span class="position-absolute badge fw-medium px-2 py-1" style="top:10px;left:10px;background:rgba(0,0,0,.55);color:#fff;font-size:.72rem;border-radius:20px;">${biz.business_type || ''}</span>
          <button class="position-absolute btn btn-sm ${faved ? 'btn-warning' : 'btn-light'} disc-fav-btn"
            style="top:8px;right:10px;width:34px;height:34px;padding:0;border-radius:50%;font-size:1rem;"
            data-biz-id="${biz.id}" data-biz-name="${biz.business_name || ''}"
            title="${faved ? 'Remove from favorites' : 'Save as favorite'}">
            ${faved ? '\u2B50' : '\u2606'}
          </button>
        </div>
        <!-- Card body -->
        <div class="card-body p-3 d-flex flex-column">
          <div class="fw-bold mb-1" style="font-size:1rem;">${biz.business_name || 'Business'}</div>
          ${biz.city ? `<div class="small text-muted mb-2">\uD83D\uDCCD ${biz.city}</div>` : ''}
          ${descSnippet ? `<p class="small text-muted mb-3 flex-grow-1" style="line-height:1.4;">${descSnippet}</p>` : '<div class="flex-grow-1"></div>'}
          <a href="${bookUrl}" class="btn btn-primary btn-sm fw-medium w-100" style="border-radius:8px;">\uD83D\uDCC5 Book Now</a>
        </div>
      </div>
    </div>`
  }).join('')

  grid.querySelectorAll('.disc-fav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await toggleFav(btn.dataset.bizId, btn.dataset.bizName)
      renderDiscover() // re-render to update star state
    })
  })
}

// Discover search + filter event wiring (runs once DOM is ready)
function wireDiscoverControls() {
  // Debounced free-text search
  document.getElementById('discoverSearch')?.addEventListener('input', () => {
    clearTimeout(discoverTimer)
    discoverTimer = setTimeout(() => { if (discoverLoaded) renderDiscover() }, 300)
  })

  // Type chips
  document.querySelectorAll('.biz-type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.biz-type-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      if (discoverLoaded) renderDiscover()
    })
  })

  // City dropdown
  document.getElementById('discoverCity')?.addEventListener('change', () => {
    if (discoverLoaded) renderDiscover()
  })
}

// ──────────────────────────────────────────────
// Filter buttons
// ──────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.className = 'btn btn-sm btn-outline-secondary filter-btn'
    })
    const activeClsMap = {
      all:       'btn btn-sm btn-primary filter-btn active',
      upcoming:  'btn btn-sm btn-outline-secondary filter-btn active',
      pending:   'btn btn-sm btn-outline-warning filter-btn active',
      completed: 'btn btn-sm btn-outline-success filter-btn active',
      cancelled: 'btn btn-sm btn-outline-danger filter-btn active',
    }
    btn.className = activeClsMap[currentFilter] || 'btn btn-sm btn-primary filter-btn active'
    renderAppointments()
  })
})

// ──────────────────────────────────────────────
// Cancel confirmation
// ──────────────────────────────────────────────
document.getElementById('confirmCancelBtn').addEventListener('click', async () => {
  if (!pendingCancelId) return
  const btn = document.getElementById('confirmCancelBtn')
  btn.disabled = true
  btn.textContent = 'Cancelling...'
  try {
    await cancelAppointment(pendingCancelId)
    // Update local state
    const appt = allAppointments.find(a => a.id === pendingCancelId)
    if (appt) appt.status = 'cancelled'
    pendingCancelId = null
    getCancelModal().hide()
    updateStats(allAppointments)
    renderAppointments()
    showToast('Appointment cancelled successfully', 'info')
  } catch (err) {
    console.error('Cancel failed:', err)
    showToast('Failed to cancel. Please try again.', 'danger')
  } finally {
    btn.disabled = false
    btn.textContent = 'Yes, Cancel It'
  }
})

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
async function init() {
  const user = await checkAuth()
  if (!user) return

  // Load client profile (needed for favorites toggle)
  currentProfile = await getProfile(user.id)

  // Update greeting
  const name = user.user_metadata?.full_name || user.email
  document.getElementById('clientGreeting').textContent = `👋 ${name}`
  document.getElementById('headerSubtitle').textContent = `Welcome back, ${user.user_metadata?.full_name || 'there'}! Here are all your appointments.`

  // Outlet: logout, nav
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logoutUser()
    window.location.href = 'login.html'
  })

  // Wire discover controls once DOM is ready
  wireDiscoverControls()
  wireNotifDrawer()

  // Load persisted notifications on page start
  renderNotifDrawer()
  updateNotifBadge()

  // Deep-link via URL hash (e.g. my-bookings.html#discover)
  const hash = window.location.hash.replace('#', '')
  if (['appointments', 'favorites', 'discover'].includes(hash)) {
    switchTab(hash)
  }

  // Load appointments and favorites in parallel
  try {
    const [appts, favs] = await Promise.all([getClientAppointments(), getFavorites()])
    allAppointments = appts
    allFavorites    = favs
    updateStats()
    renderAppointments()
    renderFavorites()
  } catch (err) {
    console.error('Failed to load data:', err)
    document.getElementById('appointmentsLoading').innerHTML =
      `<div class="alert alert-danger">Failed to load appointments. Please <a href="">refresh the page</a>.</div>`
  }

  // ─── Realtime: listen for appointment status changes ─────────────────────────
  supabase
    .channel('client-appt-status')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'appointments' },
      (payload) => {
        const updated = payload.new
        const idx = allAppointments.findIndex(a => a.id === updated.id)
        if (idx === -1) return // not this client's appointment

        const oldStatus = allAppointments[idx].status
        if (oldStatus === updated.status) return

        // Merge updated fields (keep joined relations from original)
        allAppointments[idx] = { ...allAppointments[idx], ...updated }

        // Show notification toast
        const svcName = allAppointments[idx].services?.name || 'appointment'
        const bizName = allAppointments[idx].profiles?.business_name || 'the business'
        if (updated.status === 'confirmed') {
          showToast(`✅ Your booking for "${svcName}" has been confirmed!`, 'success')
          pushNotification({
            icon: '✅',
            title: 'Booking Confirmed!',
            body: `Your appointment for "${svcName}" at ${bizName} has been confirmed.`,
            apptId: updated.id
          })
        } else if (updated.status === 'cancelled') {
          showToast(`❌ Your booking for "${svcName}" was cancelled by the business.`, 'danger')
          pushNotification({
            icon: '❌',
            title: 'Booking Cancelled',
            body: `Your appointment for "${svcName}" at ${bizName} was cancelled.`,
            apptId: updated.id
          })
        } else if (updated.status === 'completed') {
          showToast(`🎉 Your appointment for "${svcName}" is marked as completed!`, 'info')
          pushNotification({
            icon: '🎉',
            title: 'Appointment Completed',
            body: `Your appointment for "${svcName}" at ${bizName} is now completed. Thanks for visiting!`,
            apptId: updated.id
          })
        }

        // Re-render to reflect new status
        updateStats()
        renderAppointments()
      }
    )
    .subscribe()
}

init()
