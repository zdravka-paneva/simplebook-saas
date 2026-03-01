import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      env[key] = valueParts.join('=')
    }
  })
  
  return env
}

const env = loadEnv()
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

/**
 * Seed test data for SimpleBook
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // 1. Create a test business profile
    console.log('📊 Creating test business...')

    const { data: businessProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        account_type: 'business',
        email: 'salon@simplebook.com',
        business_name: 'Luxury Hair Salon',
        business_type: 'Hair Salon',
        business_description: 'Premium salon offering cutting-edge services with experienced professionals dedicated to making you look and feel your best.',
        phone: '(555) 123-4567'
      }])
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error creating business profile:', profileError.message)
      if (profileError.message.includes('violates')) {
        console.log('ℹ️  Business already exists, continuing...')
      } else {
        return
      }
    } else {
      console.log('✅ Business created:', businessProfile.id)
    }

    // Get business ID (either from new insert or existing)
    let businessId
    if (businessProfile) {
      businessId = businessProfile.id
    } else {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'salon@simplebook.com')
        .single()
      businessId = existing.id
    }

    // 2. Create services
    console.log('🛠️ Creating services...')
    const servicesData = [
      {
        business_id: businessId,
        name: 'Hair Styling',
        description: 'Professional hair styling for any occasion',
        duration_minutes: 60,
        price: 45.00,
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Hair Coloring',
        description: 'Full color treatment with premium products',
        duration_minutes: 90,
        price: 75.00,
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Haircut',
        description: 'Expert haircut tailored to your needs',
        duration_minutes: 30,
        price: 35.00,
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Women Cut and Style',
        description: 'Complete cut and styling for women',
        duration_minutes: 60,
        price: 55.00,
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Beard Trim and Shaping',
        description: 'Professional beard trimming and shaping',
        duration_minutes: 25,
        price: 25.00,
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Hair Treatment',
        description: 'Deep conditioning and hair treatment',
        duration_minutes: 45,
        price: 40.00,
        is_active: true
      }
    ]

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .insert(servicesData)
      .select()

    if (servicesError) {
      console.error('❌ Error creating services:', servicesError.message)
      return
    }

    console.log(`✅ Created ${services?.length || 0} services`)

    // 3. Create clients
    console.log('👥 Creating clients...')
    const clientsData = [
      {
        business_id: businessId,
        email: 'john@example.com',
        full_name: 'John Smith',
        phone: '(555) 987-1234',
        notes: 'Regular customer - prefers early morning appointments'
      },
      {
        business_id: businessId,
        email: 'sarah@example.com',
        full_name: 'Sarah Johnson',
        phone: '(555) 456-7890',
        notes: 'Loyal customer - color appointments every 6 weeks'
      },
      {
        business_id: businessId,
        email: 'mike@example.com',
        full_name: 'Mike Wilson',
        phone: '(555) 234-5678',
        notes: 'First-time customer'
      },
      {
        business_id: businessId,
        email: 'emma@example.com',
        full_name: 'Emma Davis',
        phone: '(555) 345-6789',
        notes: 'Regular customer - special occasion styling'
      },
      {
        business_id: businessId,
        email: 'alex@example.com',
        full_name: 'Alex Martinez',
        phone: '(555) 567-8901',
        notes: 'Beard care specialist customer'
      }
    ]

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .insert(clientsData)
      .select()

    if (clientsError) {
      console.error('❌ Error creating clients:', clientsError.message)
      return
    }

    console.log(`✅ Created ${clients?.length || 0} clients`)

    // 4. Create appointments
    console.log('📅 Creating appointments...')
    if (services && services.length > 0 && clients && clients.length > 0) {
      const appointmentsData = [
        {
          business_id: businessId,
          service_id: services[0].id,
          client_id: clients[0].id,
          scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          notes: 'Customer confirmed appointment'
        },
        {
          business_id: businessId,
          service_id: services[1].id,
          client_id: clients[1].id,
          scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          notes: 'Awaiting customer confirmation'
        },
        {
          business_id: businessId,
          service_id: services[2].id,
          client_id: clients[2].id,
          scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          notes: 'New customer first appointment'
        },
        {
          business_id: businessId,
          service_id: services[3].id,
          client_id: clients[3].id,
          scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          notes: 'Special occasion styling'
        },
        {
          business_id: businessId,
          service_id: services[4].id,
          client_id: clients[4].id,
          scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
          notes: 'Regular customer appointment'
        }
      ]

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .insert(appointmentsData)
        .select()

      if (appointmentsError) {
        console.error('❌ Error creating appointments:', appointmentsError.message)
        return
      }

      console.log(`✅ Created ${appointments?.length || 0} appointments`)
    }

    console.log('\n✨ Database seeding completed successfully!')
    console.log(`\n🏢 Business ID: ${businessId}`)
    console.log(`📅 Booking page: http://localhost:5173/booking.html?business=${businessId}`)

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }

  process.exit(0)
}

// Run seeding
seedDatabase()

