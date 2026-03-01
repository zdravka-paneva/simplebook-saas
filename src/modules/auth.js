import { supabase } from '../services/supabase.js'

/**
 * Register a new business owner
 * @param {string} email - Email address
 * @param {string} password - Password
 * @param {Object} metadata - Business details (business_name, business_type)
 * @returns {Promise<Object>} User and session data
 */
export async function registerUser(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })

  if (error) throw error
  return data
}

/**
 * Login a business owner
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} User and session data
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

/**
 * Watch for authentication state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session)
  })
}
