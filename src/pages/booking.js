import { supabase, getProfileById, getProfile, addFavorite, isFavorite } from '../services/supabase.js'
import { getCurrentUser, logoutUser } from '../modules/auth.js'

const bookingForm = document.getElementById('bookingForm')
const appointmentDateInput = document.getElementById('appointmentDate')
const appointmentTimeSelect = document.getElementById('appointmentTime')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successMessage = document.getElementById('successMessage')

let selectedServiceId = null
let selectedServicePrice = 0
let selectedServiceDuration = 0
let currentBusinessId = null
let currentServices = []

// Get business ID from URL parameter
function getBusinessIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('business') || localStorage.getItem('bookingBusinessId') || null
}

// Load services from database
async function loadServices() {
  try {
    const businessId = getBusinessIdFromUrl() || currentBusinessId
    
    if (!businessId) {
      errorMessage.textContent = 'Business not found. Please use the correct link.'
      errorAlert.style.display = 'block'
      return
    }

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)

    if (error) throw error

    currentServices = services || []
    const servicesList = document.getElementById('servicesList')
    servicesList.innerHTML = ''

    if (currentServices.length === 0) {
      servicesList.innerHTML = '<div class="col-12"><p class="text-muted text-center">No services available.</p></div>'
      return
    }

    currentServices.forEach(service => {
      const col = document.createElement('div')
      col.className = 'col-sm-6'
      col.innerHTML = `
        <div class="service-card card border-0 shadow-sm cursor-pointer service-option" 
             data-service-id="${service.id}" 
             data-price="${service.price}" 
             data-duration="${service.duration_minutes}"
             style="cursor: pointer; transition: all 0.3s;">
          <div class="card-body">
            <h6 class="fw-bold">${service.name}</h6>
            <p class="small text-muted mb-3">${service.description || ''}</p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <span class="badge bg-primary">$${parseFloat(service.price).toFixed(2)}</span>
              <span class="small text-muted">${service.duration_minutes} min</span>
            </div>
          </div>
        </div>
      `

      col.addEventListener('click', () => selectService(service.id, service.price, service.duration_minutes, service.name))
      servicesList.appendChild(col)
    })
  } catch (error) {
    console.error('Failed to load services:', error)
    errorMessage.textContent = 'Failed to load services'
    errorAlert.style.display = 'block'
  }
}

// Select service
function selectService(serviceId, price, duration, serviceName) {
  selectedServiceId = serviceId
  selectedServicePrice = price
  selectedServiceDuration = duration

  document.querySelectorAll('.service-option').forEach(card => {
    card.classList.remove('border-primary')
    card.style.border = ''
  })

  event.currentTarget.classList.add('border-primary')
  event.currentTarget.style.border = '2px solid #0066cc'

  document.getElementById('summaryService').textContent = serviceName
  document.getElementById('summaryDuration').textContent = `${duration} minutes`
  document.getElementById('summaryPrice').textContent = `$${price.toFixed(2)}`
  document.getElementById('selectedService').value = serviceId
}

// Generate time slots
function generateTimeSlots() {
  const slots = []
  const start = 9 * 60
  const end = 17 * 60
  const interval = 30

  for (let time = start; time < end; time += interval) {
    const hours = Math.floor(time / 60)
    const mins = time % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    const timeStr = `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`
    slots.push(timeStr)
  }

  return slots
}

// Initialize date input
function initDateInput() {
  const today = new Date().toISOString().split('T')[0]
  appointmentDateInput.min = today
  appointmentDateInput.value = today
}

// Handle date change
appointmentDateInput.addEventListener('change', (e) => {
  const selectedDate = new Date(e.target.value)
  const dayOfWeek = selectedDate.getDay()

  if (dayOfWeek === 0) {
    errorMessage.textContent = 'We are closed on Sundays. Please select another date.'
    errorAlert.style.display = 'block'
    appointmentTimeSelect.innerHTML = '<option value="">No slots available</option>'
    return
  }

  errorAlert.style.display = 'none'
  populateTimeSlots()
})

// Populate time slots
function populateTimeSlots() {
  const slots = generateTimeSlots()
  appointmentTimeSelect.innerHTML = '<option value="">Select a time</option>'

  slots.forEach(slot => {
    const option = document.createElement('option')
    option.value = slot
    option.textContent = slot
    appointmentTimeSelect.appendChild(option)
  })
}

// Update booking summary when time is selected
appointmentTimeSelect.addEventListener('change', (e) => {
  if (e.target.value && appointmentDateInput.value) {
    const dateObj = new Date(appointmentDateInput.value)
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    document.getElementById('summaryDateTime').textContent = `${dateStr} at ${e.target.value}`
  }
})

// Form submission
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  errorAlert.style.display = 'none'
  successMessage.style.display = 'none'

  // Validate
  if (!selectedServiceId) {
    errorMessage.textContent = 'Please select a service'
    errorAlert.style.display = 'block'
    return
  }

  if (!appointmentDateInput.value) {
    errorMessage.textContent = 'Please select a date'
    errorAlert.style.display = 'block'
    return
  }

  if (!appointmentTimeSelect.value) {
    errorMessage.textContent = 'Please select a time'
    errorAlert.style.display = 'block'
    return
  }

  try {
    const submitBtn = bookingForm.querySelector('button[type="submit"]')
    const submitText = document.getElementById('submitText')
    const loadingSpinner = document.getElementById('loadingSpinner')

    // Show loading
    submitBtn.disabled = true
    submitText.style.display = 'none'
    loadingSpinner.style.display = 'inline-block'

    const clientName = document.getElementById('clientName').value
    const clientEmail = document.getElementById('clientEmail').value
    const clientPhone = document.getElementById('clientPhone').value
    const clientNotes = document.getElementById('clientNotes').value

    if (!clientName || !clientEmail || !clientPhone) {
      throw new Error('Please fill in all required fields')
    }

    // Create client record
    const businessId = getBusinessIdFromUrl() || currentBusinessId
    const loggedUser = await getCurrentUser()

    // Get the client's profile.id (needed for RLS to link appointments to client)
    let clientProfileId = null
    if (loggedUser) {
      try {
        const profile = await getProfile(loggedUser.id)
        clientProfileId = profile?.id || null
      } catch { /* not logged in or profile missing — booking still works without link */ }
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([{
        business_id: businessId,
        email: clientEmail,
        full_name: clientName,
        phone: clientPhone,
        notes: clientNotes,
        // Link to profile so client can see their appointments in the client dashboard
        profile_id: clientProfileId
      }])
      .select()
      .single()

    if (clientError) throw clientError

    // Combine date and time
    const timeMatch = appointmentTimeSelect.value.match(/(\d+):(\d+)\s(AM|PM)/)
    if (!timeMatch) throw new Error('Invalid time format')

    const [, hoursStr, minutesStr, period] = timeMatch
    let hour24 = parseInt(hoursStr)
    if (period === 'PM' && hour24 !== 12) hour24 += 12
    if (period === 'AM' && hour24 === 12) hour24 = 0

    const appointmentDateTime = new Date(appointmentDateInput.value)
    appointmentDateTime.setHours(hour24, parseInt(minutesStr), 0)

    // Create appointment
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .insert([{
        business_id: businessId,
        service_id: selectedServiceId,
        client_id: clientData.id,
        scheduled_at: appointmentDateTime.toISOString(),
        status: 'pending'
      }])
      .select()

    if (appointmentError) throw appointmentError

    // Show success
    bookingForm.style.display = 'none'
    successMessage.style.display = 'block'
    window.scrollTo(0, 0)

    // Save as favorite button (DB-backed)
    const favBtn = document.getElementById('saveAsFavoriteBtn')
    if (favBtn && currentBusinessId) {
      const loggedUserForFav = await getCurrentUser()
      if (!loggedUserForFav) {
        // Not logged in — hide the fav button
        favBtn.style.display = 'none'
      } else {
        // Check if already favorited
        const clientProf = await getProfile(loggedUserForFav.id)
        if (clientProf) {
          const already = await isFavorite(clientProf.id, currentBusinessId)
          if (already) {
            favBtn.textContent = '⭐ Already in Favorites'
            favBtn.disabled = true
          }
          favBtn.addEventListener('click', async () => {
            try {
              await addFavorite(clientProf.id, currentBusinessId)
              favBtn.textContent = '⭐ Saved to Favorites!'
              favBtn.disabled = true
              favBtn.classList.remove('btn-outline-warning')
              favBtn.classList.add('btn-warning')
            } catch (err) {
              console.error('Save favorite failed:', err)
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Booking failed:', error)
    errorMessage.textContent = error.message || 'Failed to create appointment'
    errorAlert.style.display = 'block'

    const submitBtn = bookingForm.querySelector('button[type="submit"]')
    const submitText = document.getElementById('submitText')
    const loadingSpinner = document.getElementById('loadingSpinner')
    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})

// Initialize page
async function initPage() {
  const businessId = getBusinessIdFromUrl()

  // Check if client is logged in - show their name and logout button
  try {
    const user = await getCurrentUser()
    if (user) {
      const greeting = document.getElementById('clientGreeting')
      const logoutBtn = document.getElementById('clientLogoutBtn')
      if (greeting) {
        greeting.textContent = `👋 ${user.user_metadata?.full_name || user.email}`
        greeting.style.display = 'inline'
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-block'

      // Pre-fill client details in the form
      const nameField = document.getElementById('clientName')
      const emailField = document.getElementById('clientEmail')
      const phoneField = document.getElementById('clientPhone')
      if (nameField && user.user_metadata?.full_name) nameField.value = user.user_metadata.full_name
      if (emailField) emailField.value = user.email
      if (phoneField && user.user_metadata?.phone) phoneField.value = user.user_metadata.phone
    }
  } catch (e) {
    // not logged in - that's fine, booking page is public
  }

  // Logout button
  const logoutBtn = document.getElementById('clientLogoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutUser()
      window.location.href = 'login.html'
    })
  }

  if (!businessId) {
    // If logged in as client → redirect to client dashboard
    const user = await getCurrentUser()
    if (user && user.user_metadata?.account_type === 'client') {
      window.location.href = 'my-bookings.html'
      return
    }
    // If not logged in → show info panel
    document.getElementById('noBusiness').style.display = 'block'
    const bc = document.getElementById('bookingContainer')
    if (bc) bc.style.display = 'none'
    return
  }

  currentBusinessId = businessId
  localStorage.setItem('bookingBusinessId', businessId)

  try {
    const profile = await getProfileById(businessId)
    if (profile) {
      document.getElementById('businessName').textContent = profile.business_name || 'Our Business'
      document.getElementById('businessType').textContent = profile.business_type || ''
      document.getElementById('businessDescription').textContent =
        profile.business_description || 'Welcome! Book your appointment below.'
      document.getElementById('businessEmail').textContent = profile.email || '—'
      document.getElementById('businessPhone').textContent = profile.phone || '—'
      document.getElementById('businessAddress').textContent = profile.address || '—'

      if (profile.business_image_url) {
        const photoContainer = document.getElementById('businessPhotoContainer')
        if (photoContainer) {
          photoContainer.innerHTML = `<img src="${profile.business_image_url}" alt="${profile.business_name}" class="rounded-3 mb-3 w-100" style="max-height:200px; object-fit:cover;">`
        }
      }

      document.title = `Book at ${profile.business_name} - SimpleBook`
    } else {
      document.getElementById('businessName').textContent = 'Business not found'
    }
  } catch (error) {
    console.error('Failed to load business profile:', error)
  }

  initDateInput()
  await loadServices()
}

// Initialize
initPage()
