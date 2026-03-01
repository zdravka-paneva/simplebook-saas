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
