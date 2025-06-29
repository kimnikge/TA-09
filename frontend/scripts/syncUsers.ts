import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function syncUsersFromAuth() {
  console.log('🔄 Синхронизация пользователей из auth.users в profiles...')
  console.log('=' .repeat(70))
  
  try {
    // Получаем все записи из profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Ошибка получения profiles:', profilesError.message)
      return
    }
    
    console.log(`📋 Найдено записей в profiles: ${profiles?.length || 0}`)
    
    // Список пользователей из auth.users (по скриншоту)
    const authUsers = [
      {
        id: '5b168adc-d3e9-409d-abbb-4d2c6e12204a',
        email: 'e.yugay.fregat@gmail.com'
      },
      {
        id: 'a0fc8606-9785-4f43-b2a1-2147bcee3a6a', 
        email: 'kimnikge@gmail.com'
      }
    ]
    
    console.log('📧 Найденные пользователи из auth.users:')
    authUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id})`)
    })
    console.log('')
    
    // Обновляем каждого пользователя
    for (const authUser of authUsers) {
      console.log(`🔄 Обрабатываем: ${authUser.email}`)
      
      // Находим соответствующую запись в profiles
      const profileRecord = profiles?.find(p => p.id === authUser.id)
      
      if (profileRecord) {
        console.log(`   ✅ Запись в profiles найдена`)
        console.log(`   📧 Обновляем email: ${profileRecord.email || 'НЕТ'} → ${authUser.email}`)
        
        // Определяем роль
        const isAdmin = authUser.email.includes('kimnikge') || authUser.email.includes('admin')
        const role = isAdmin ? 'admin' : 'sales_rep'
        const name = authUser.email.split('@')[0]
        
        // Обновляем запись
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: authUser.email,
            name: name,
            role: role,
            approved: true
          })
          .eq('id', authUser.id)
        
        if (updateError) {
          console.error(`   ❌ Ошибка обновления: ${updateError.message}`)
        } else {
          console.log(`   ✅ Успешно обновлен:`)
          console.log(`      📧 Email: ${authUser.email}`)
          console.log(`      👤 Имя: ${name}`)
          console.log(`      🔑 Роль: ${role}`)
          console.log(`      ✅ Статус: Одобрен`)
        }
      } else {
        console.log(`   ⚠️ Запись в profiles НЕ найдена, создаем новую...`)
        
        // Создаем новую запись
        const isAdmin = authUser.email.includes('kimnikge') || authUser.email.includes('admin')
        const role = isAdmin ? 'admin' : 'sales_rep'
        const name = authUser.email.split('@')[0]
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: name,
            role: role,
            approved: true
          })
        
        if (insertError) {
          console.error(`   ❌ Ошибка создания: ${insertError.message}`)
        } else {
          console.log(`   ✅ Новая запись создана:`)
          console.log(`      📧 Email: ${authUser.email}`)
          console.log(`      👤 Имя: ${name}`)
          console.log(`      🔑 Роль: ${role}`)
          console.log(`      ✅ Статус: Одобрен`)
        }
      }
      console.log('')
    }
    
    console.log('🎉 Синхронизация завершена!')
    console.log('🔄 Перезагрузите страницу в браузере, чтобы увидеть изменения')
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

syncUsersFromAuth()

export { syncUsersFromAuth }
