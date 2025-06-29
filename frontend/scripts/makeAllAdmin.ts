import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function makeUsersAdmin() {
  console.log('🔧 Назначение ролей администратора всем пользователям...')
  console.log('=' .repeat(60))
  
  try {
    // Получаем всех пользователей из profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Ошибка получения profiles:', profilesError.message)
      return
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ Пользователей не найдено')
      return
    }
    
    console.log(`👥 Найдено пользователей: ${profiles.length}`)
    console.log('')
    
    // Обновляем каждого пользователя
    for (let i = 0; i < profiles.length; i++) {
      const user = profiles[i]
      console.log(`🔄 Обрабатываем пользователя ${i + 1}/${profiles.length}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Текущая роль: ${user.role || 'НЕ УКАЗАНА'}`)
      console.log(`   Текущий статус: ${user.approved ? 'Одобрен' : 'Заблокирован'}`)
      
      // Генерируем email если его нет
      let emailToSet = user.email
      if (!emailToSet) {
        emailToSet = `user${i + 1}@company.com`
        console.log(`   📧 Назначаем email: ${emailToSet}`)
      }
      
      // Обновляем пользователя
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: emailToSet,
          name: user.name || `Пользователь ${i + 1}`,
          role: 'admin',
          approved: true
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error(`   ❌ Ошибка обновления: ${updateError.message}`)
      } else {
        console.log(`   ✅ Успешно обновлен:`)
        console.log(`      📧 Email: ${emailToSet}`)
        console.log(`      👤 Имя: ${user.name || `Пользователь ${i + 1}`}`)
        console.log(`      🔑 Роль: admin`)
        console.log(`      ✅ Статус: Одобрен`)
      }
      console.log('')
    }
    
    console.log('🎉 Все пользователи обновлены!')
    console.log('🔄 Теперь выйдите и войдите заново, чтобы увидеть изменения')
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

makeUsersAdmin()

export { makeUsersAdmin }
