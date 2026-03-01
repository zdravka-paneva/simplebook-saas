import { supabase, getOrCreateProfile } from '../services/supabase.js'

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
  
  // Create profile after successful registration
  if (data.user) {
    try {
      await getOrCreateProfile(data.user.id, {
        email,
        account_type: metadata.account_type || 'client',
        full_name: metadata.full_name || '',
        business_name: metadata.business_name || '',
        business_type: metadata.business_type || '',
        phone: metadata.phone || ''
      })
    } catch (profileError) {
      console.error('Failed to create profile:', profileError)
      // Don't throw - user is still registered, just profile creation failed
    }
  }
  
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
  
  // Ensure profile exists
  if (data.user) {
    try {
      await getOrCreateProfile(data.user.id, {
        email: data.user.email,
        account_type: data.user.user_metadata?.account_type || 'client'
      })
    } catch (profileError) {
      console.error('Failed to ensure profile exists:', profileError)
      // Don't throw - user is logged in, just ensuring profile failed
    }
  }
  
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
