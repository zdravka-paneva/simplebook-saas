#!/usr/bin/env node

/**
 * SimpleBook SaaS - Setup & Demo Data Script
 * This script helps set up a demo account and populates it with sample data
 * Run this AFTER manually creating a business account in the app
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log(`
╔════════════════════════════════════════────════╗
║    SimpleBook SaaS - Demo Setup & Seeding      ║
╚════════════════════════════════════════════════╝
`)

// Demo Data
const DEMO_BUSINESS_ID = 'demo-business-id' // Will be set after account creation
const DEMO_SERVICES = [
  { name: 'Haircut', description: 'Professional haircut service', duration_minutes: 30, price: 25.00 },
  { name: 'Hair Coloring', description: 'Full hair coloring session', duration_minutes: 60, price: 75.00 },
  { name: 'Styling', description: 'Professional hair styling for events', duration_minutes: 45, price: 40.00 },
  { name: 'Beard Trim', description: 'Professional beard trimming and shaping', duration_minutes: 20, price: 15.00 },
  { name: 'Kids Haircut', description: 'Haircut for children', duration_minutes: 25, price: 18.00 },
  { name: 'Hair Treatment', description: 'Deep conditioning treatment', duration_minutes: 30, price: 35.00 }
]

const DEMO_CLIENTS = [
  { full_name: 'John Smith', email: 'john@example.com', phone: '555-0101' },
  { full_name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-0102' },
  { full_name: 'Mike Wilson', email: 'mike@example.com', phone: '555-0103' },
  { full_name: 'Emma Davis', email: 'emma@example.com', phone: '555-0104' },
  { full_name: 'James Brown', email: 'james@example.com', phone: '555-0105' }
]

async function seedDatabase(businessId) {
  try {
    console.log('\n📚 Starting database seeding...\n')

    // Step 1: Create Services
    console.log('🛠️  Creating services...')
    const services = []
    for (const serviceData of DEMO_SERVICES) {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          business_id: businessId,
          name: serviceData.name,
          description: serviceData.description,
          duration_minutes: serviceData.duration_minutes,
          price: serviceData.price,
          is_active: true
        }])
        .select()

      if (error) {
        console.error(`❌ Error creating service "${serviceData.name}":`, error.message)
      } else {
        console.log(`   ✅ Created service: ${serviceData.name}`)
        services.push(data[0])
      }
    }

    // Step 2: Create Clients
    console.log('\n👥 Creating demo clients...')
    const clients = []
    for (const clientData of DEMO_CLIENTS) {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          business_id: businessId,
          full_name: clientData.full_name,
          email: clientData.email,
          phone: clientData.phone,
          notes: 'Demo client created during setup'
        }])
        .select()

      if (error) {
        console.error(`❌ Error creating client "${clientData.full_name}":`, error.message)
      } else {
        console.log(`   ✅ Created client: ${clientData.full_name}`)
        clients.push(data[0])
      }
    }

    // Step 3: Create Appointments
    console.log('\n📅 Creating demo appointments...')
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    for (let i = 0; i < 5 && i < clients.length && i < services.length; i++) {
      const appointmentDate = new Date(nextWeek)
      appointmentDate.setDate(appointmentDate.getDate() + i)
      appointmentDate.setHours(10 + i, 0, 0, 0)

      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          business_id: businessId,
          service_id: services[i].id,
          client_id: clients[i].id,
          scheduled_at: appointmentDate.toISOString(),
          status: i < 3 ? 'confirmed' : 'pending',
          notes: `Demo appointment ${i + 1}`
        }])
        .select()

      if (error) {
        console.error(`❌ Error creating appointment:`, error.message)
      } else {
        console.log(`   ✅ Created appointment for ${clients[i].full_name}`)
      }
    }

    console.log('\n✅ Database seeding completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - Services created: ${services.length}`)
    console.log(`   - Clients created: ${clients.length}`)
    console.log(`   - Appointments created: ${Math.min(5, clients.length, services.length)}\n`)

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('📋 Setup Instructions:\n')
  console.log('1. Visit: https://simplebook-saas.example.com/register.html')
  console.log('2. Create a BUSINESS account with these details:')
  console.log('   - Email: business@demo.com')
  console.log('   - Password: DemoPassword123!')
  console.log('   - Business Name: Demo Hair Salon')
  console.log('   - Business Type: Hair Salon')
  console.log('   - Description: A professional hair salon demo')
  console.log('')
  console.log('3. After creating the account, run this command with your business ID:')
  console.log('   node seed-setup.mjs <your-business-id>')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Check if business ID was provided
  const businessId = process.argv[2]

  if (!businessId) {
    console.log('⚠️  No business ID provided.')
    console.log('To seed the database, run: node seed-setup.mjs <business-id>\n')
    console.log('💡 Tip: You can find your business ID in the dashboard URL or in the profiles table\n')
    return
  }

  console.log(`🚀 Using business ID: ${businessId}\n`)

  // Verify business exists
  console.log('🔍 Verifying business profile...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', businessId)
    .eq('account_type', 'business')
    .single()

  if (profileError || !profile) {
    console.error('❌ Business profile not found. Please ensure:')
    console.error('   1. You registered a BUSINESS account')
    console.error('   2. The business ID is correct')
    console.error('   3. Try: SELECT id, business_name FROM profiles WHERE account_type = "business"\n')
    process.exit(1)
  }

  console.log(`✅ Found business: ${profile.business_name}\n`)

  // Seed the database
  await seedDatabase(businessId)

  console.log('✨ All done! Your demo data is ready.\n')
  console.log('Next steps:')
  console.log('1. Login to the dashboard at: https://simplebook-saas.example.com/dashboard.html')
  console.log('2. View your new services, clients, and appointments')
  console.log('3. Test the booking page with your business ID\n')
}

main()
