import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Get all services for a specific business
 * @param {string} businessId - Business/Profile ID
 * @returns {Promise<Array>} Array of services
 */
export async function getServices(businessId) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)

  if (error) throw error
  return data
}

/**
 * Get all appointments for a business
 * @param {string} businessId - Business/Profile ID
 * @returns {Promise<Array>} Array of appointments
 */
export async function getAppointments(businessId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .order('appointment_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Create a new appointment
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<Object>} Created appointment
 */
export async function createAppointment(appointmentData) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([appointmentData])
    .select()

  if (error) throw error
  return data[0]
}
/**
 * Get or create user profile
 * @param {string} userId - Auth user ID
 * @param {Object} profileData - Profile information
 * @returns {Promise<Object>} Profile object
 */
export async function getOrCreateProfile(userId, profileData = {}) {
  try {
    // Try to get existing profile
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      return existingProfile
    }

    // If not found, create new profile
    if (selectError?.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            email: profileData.email || '',
            account_type: profileData.account_type || 'client',
            full_name: profileData.full_name || '',
            business_name: profileData.business_name || '',
            business_type: profileData.business_type || '',
            phone: profileData.phone || ''
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError
      return newProfile
    }

    throw selectError
  } catch (error) {
    console.error('Error getting or creating profile:', error)
    throw error
  }
}

/**
 * Get user profile by ID
 * @param {string} userId - Auth user ID
 * @returns {Promise<Object>} Profile object
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // PGRST116 = 0 rows found - not an error, just no profile yet
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

/**
 * Update user profile
 * @param {string} userId - Auth user ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(userId, updates) {
  // Use upsert so it works even if the profile row doesn't exist yet
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()

  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Create a new service
 * @param {Object} serviceData - Service details
 * @returns {Promise<Object>} Created service
 */
export async function createService(serviceData) {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a service
 * @param {string} serviceId - Service ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated service
 */
export async function updateService(serviceId, updates) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a service
 * @param {string} serviceId - Service ID
 * @returns {Promise<void>}
 */
export async function deleteService(serviceId) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (error) throw error
}

/**
 * Get all clients for a business
 * @param {string} businessId - Business/Profile ID
 * @returns {Promise<Array>} Array of clients
 */
export async function getClients(businessId) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)

  if (error) throw error
  return data
}

/**
 * Get all appointments with related data
 * @param {string} businessId - Business/Profile ID
 * @returns {Promise<Array>} Array of appointments with client and service info
 */
export async function getAppointmentsWithDetails(businessId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      clients (full_name, email, phone),
      services (name, duration_minutes, price)
    `)
    .eq('business_id', businessId)
    .order('scheduled_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated appointment
 */
export async function updateAppointmentStatus(appointmentId, status) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Upload profile picture to Supabase Storage
 * @param {string} userId - User ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadProfilePicture(userId, file) {
  // Create unique filename with timestamp
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${timestamp}.${fileExt}`
  const filePath = `profile-pictures/${fileName}`

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Delete profile picture from storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<void>}
 */
export async function deleteProfilePicture(filePath) {
  const { error } = await supabase.storage
    .from('user-uploads')
    .remove([filePath])

  if (error) throw error
}

/**
 * Upload business photo to Supabase Storage
 * @param {string} userId - User ID
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadBusinessPhoto(userId, file) {
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-business-${timestamp}.${fileExt}`
  const filePath = `business-photos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('user-uploads').getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Upload document to Supabase Storage
 * @param {string} businessId - Business ID
 * @param {File} file - Document file to upload
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadDocument(businessId, file) {
  // Create unique filename with timestamp
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${businessId}-${timestamp}-${file.name}`
  const filePath = `documents/${businessId}/${fileName}`

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Get download URL for a file
 * @param {string} filePath - File path in storage
 * @returns {Promise<string>} Download URL
 */
export async function getDownloadUrl(filePath) {
  const { data } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath)

  return data.publicUrl
}