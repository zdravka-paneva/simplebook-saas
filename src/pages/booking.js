import { getCurrentUser } from '../modules/auth.js'

const bookingForm = document.getElementById('bookingForm')
const appointmentDateInput = document.getElementById('appointmentDate')
const appointmentTimeSelect = document.getElementById('appointmentTime')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successMessage = document.getElementById('successMessage')

let selectedServiceId = null
let selectedServicePrice = 0
let selectedServiceDuration = 0

// Mock services data
const mockServices = [
  { id: 1, name: 'Hair Styling', price: 45.00, duration: 60 },
  { id: 2, name: 'Hair Coloring', price: 75.00, duration: 90 },
  { id: 3, name: 'Haircut', price: 35.00, duration: 30 },
  { id: 4, name: 'Women\'s Cut & Style', price: 55.00, duration: 60 }
]

// Mock available time slots by date
const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
]

// Load services on page load
function loadServices() {
  const servicesList = document.getElementById('servicesList')
  servicesList.innerHTML = ''

  mockServices.forEach(service => {
    const col = document.createElement('div')
    col.className = 'col-sm-6'
    col.innerHTML = `
      <div class="service-card card border-0 shadow-sm cursor-pointer service-option" 
           data-service-id="${service.id}" 
           data-price="${service.price}" 
           data-duration="${service.duration}"
           style="cursor: pointer; transition: all 0.3s;">
        <div class="card-body">
          <h6 class="fw-bold">${service.name}</h6>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="badge bg-primary">$${service.price.toFixed(2)}</span>
            <span class="small text-muted">${service.duration} min</span>
          </div>
        </div>
      </div>
    `

    col.addEventListener('click', () => selectService(service.id, service.price, service.duration, service.name))
    servicesList.appendChild(col)
  })
}

// Select service
function selectService(serviceId, price, duration, serviceName) {
  selectedServiceId = serviceId
  selectedServicePrice = price
  selectedServiceDuration = duration

  // Update UI
  document.querySelectorAll('.service-option').forEach(card => {
    card.classList.remove('border-primary')
    card.style.border = ''
  })

  event.currentTarget.classList.add('border-primary')
  event.currentTarget.style.border = '2px solid #0066cc'

  // Update summary
  document.getElementById('summaryService').textContent = serviceName
  document.getElementById('summaryDuration').textContent = `${duration} minutes`
  document.getElementById('summaryPrice').textContent = `$${price.toFixed(2)}`
  document.getElementById('selectedService').value = serviceId
}

// Set minimum date to today
function initDateInput() {
  const today = new Date().toISOString().split('T')[0]
  appointmentDateInput.min = today
  appointmentDateInput.value = today
}

// Generate time slots for selected date
appointmentDateInput.addEventListener('change', (e) => {
  const selectedDate = new Date(e.target.value)
  const dayOfWeek = selectedDate.getDay()

  // Skip Sundays (0)
  if (dayOfWeek === 0) {
    errorMessage.textContent = 'We are closed on Sundays. Please select another date.'
    errorAlert.style.display = 'block'
    appointmentTimeSelect.innerHTML = '<option value="">No slots available</option>'
    return
  }

  errorAlert.style.display = 'none'
  populateTimeSlots()
})

// Populate time slot dropdown
function populateTimeSlots() {
  appointmentTimeSelect.innerHTML = '<option value="">Select a time</option>'

  timeSlots.forEach(slot => {
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

    // Collect form data
    const bookingData = {
      serviceId: selectedServiceId,
      appointmentDate: appointmentDateInput.value,
      appointmentTime: appointmentTimeSelect.value,
      clientName: document.getElementById('clientName').value,
      clientEmail: document.getElementById('clientEmail').value,
      clientPhone: document.getElementById('clientPhone').value,
      clientNotes: document.getElementById('clientNotes').value,
      totalPrice: selectedServicePrice
    }

    console.log('Booking data:', bookingData)

    // Mock API call (simulate delay)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Show success
    successMessage.style.display = 'block'
    bookingForm.style.display = 'none'

    // Reset button
    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'

  } catch (error) {
    errorMessage.textContent = error.message || 'Booking failed. Please try again.'
    errorAlert.style.display = 'block'

    const submitBtn = bookingForm.querySelector('button[type="submit"]')
    const submitText = document.getElementById('submitText')
    const loadingSpinner = document.getElementById('loadingSpinner')

    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})

// Initialize on page load
initDateInput()
loadServices()
populateTimeSlots()
