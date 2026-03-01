import { supabase } from './src/services/supabase.js'

/**
 * Seed test data for SimpleBook
 * Run this script to populate the database with test data
 */

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // 1. Create a test business profile
    console.log('📊 Creating test business...')
    const businessId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' // Will use UUID from insert response

    // Since we can't insert without a real auth user, we'll use NULL as placeholder
    // In production, use actual auth.users IDs
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
      return
    }

    const matchedBusinessId = businessProfile.id
    console.log('✅ Business created:', matchedBusinessId)

    // 2. Create services
    console.log('🛠️ Creating services...')
    const servicesData = [
      {
        business_id: matchedBusinessId,
        name: 'Hair Styling',
        description: 'Professional hair styling for any occasion',
        duration_minutes: 60,
        price: 45.00,
        is_active: true
      },
      {
        business_id: matchedBusinessId,
        name: 'Hair Coloring',
        description: 'Full color treatment with premium products',
        duration_minutes: 90,
        price: 75.00,
        is_active: true
      },
      {
        business_id: matchedBusinessId,
        name: 'Haircut',
        description: 'Expert haircut tailored to your needs',
        duration_minutes: 30,
        price: 35.00,
        is_active: true
      },
      {
        business_id: matchedBusinessId,
        name: 'Women Cut and Style',
        description: 'Complete cut and styling for women',
        duration_minutes: 60,
        price: 55.00,
        is_active: true
      },
      {
        business_id: matchedBusinessId,
        name: 'Beard Trim and Shaping',
        description: 'Professional beard trimming and shaping',
        duration_minutes: 25,
        price: 25.00,
        is_active: true
      },
      {
        business_id: matchedBusinessId,
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

    console.log(`✅ Created ${services.length} services`)

    // 3. Create clients
    console.log('👥 Creating clients...')
    const clientsData = [
      {
        business_id: matchedBusinessId,
        email: 'john@example.com',
        full_name: 'John Smith',
        phone: '(555) 987-1234',
        notes: 'Regular customer - prefers early morning appointments'
      },
      {
        business_id: matchedBusinessId,
        email: 'sarah@example.com',
        full_name: 'Sarah Johnson',
        phone: '(555) 456-7890',
        notes: 'Loyal customer - color appointments every 6 weeks'
      },
      {
        business_id: matchedBusinessId,
        email: 'mike@example.com',
        full_name: 'Mike Wilson',
        phone: '(555) 234-5678',
        notes: 'First-time customer'
      },
      {
        business_id: matchedBusinessId,
        email: 'emma@example.com',
        full_name: 'Emma Davis',
        phone: '(555) 345-6789',
        notes: 'Regular customer - special occasion styling'
      },
      {
        business_id: matchedBusinessId,
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

    console.log(`✅ Created ${clients.length} clients`)

    // 4. Create appointments
    console.log('📅 Creating appointments...')
    const appointmentsDat = []

    // Create a few sample appointments
    if (services.length > 0 && clients.length > 0) {
      appointmentsDat.push({
        business_id: matchedBusinessId,
        service_id: services[0].id,
        client_id: clients[0].id,
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        status: 'confirmed',
        notes: 'Customer confirmed appointment'
      })

      appointmentsDat.push({
        business_id: matchedBusinessId,
        service_id: services[1].id,
        client_id: clients[1].id,
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        status: 'pending',
        notes: 'Awaiting customer confirmation'
      })

      appointmentsDat.push({
        business_id: matchedBusinessId,
        service_id: services[2].id,
        client_id: clients[2].id,
        scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        status: 'confirmed',
        notes: 'New customer first appointment'
      })

      appointmentsDat.push({
        business_id: matchedBusinessId,
        service_id: services[3].id,
        client_id: clients[3].id,
        scheduled_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        status: 'confirmed',
        notes: 'Special occasion styling'
      })

      appointmentsDat.push({
        business_id: matchedBusinessId,
        service_id: services[4].id,
        client_id: clients[4].id,
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'confirmed',
        notes: 'Regular customer appointment'
      })

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .insert(appointmentsDat)
        .select()

      if (appointmentsError) {
        console.error('❌ Error creating appointments:', appointmentsError.message)
        return
      }

      console.log(`✅ Created ${appointments.length} appointments`)
    }

    console.log('\n✨ Database seeding completed successfully!')
    console.log(`\n Business ID for booking link: ${matchedBusinessId}`)
    console.log(`📅 Booking page: http://localhost:5173/booking.html?business=${matchedBusinessId}`)

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }
}

// Run seeding
seedDatabase()
