import { createClient } from '@supabase/supabase-js'

// Загружаем переменные окружения
const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function makeUserAdmin() {
  console.log('🔧 Назначение роли администратора...')
  
  try {
    // Получаем всех пользователей
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Ошибка получения профилей:', profilesError.message)
      return
    }
    
    console.log('👥 Найдено пользователей:', profiles?.length || 0)
    
    if (profiles && profiles.length > 0) {
      // Показываем всех пользователей
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`)
        console.log(`   Email: ${profile.email || 'не указан'}`)
        console.log(`   Имя: ${profile.name || 'не указано'}`)
        console.log(`   Роль: ${profile.role || 'не указана'}`)
        console.log(`   Статус: ${profile.approved ? 'Одобрен' : 'Заблокирован'}`)
        console.log('   ---')
      })
      
      // Назначаем первого пользователя администратором
      const firstUser = profiles[0]
      console.log(`🔑 Назначаем пользователя "${firstUser.name || firstUser.email || firstUser.id}" администратором...`)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          approved: true
        })
        .eq('id', firstUser.id)
      
      if (updateError) {
        console.error('❌ Ошибка обновления роли:', updateError.message)
      } else {
        console.log('✅ Роль администратора успешно назначена!')
        console.log('🔄 Перезагрузите страницу в браузере, чтобы увидеть изменения')
      }
    } else {
      console.log('❌ Пользователей не найдено')
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

// Запуск
makeUserAdmin()

export { makeUserAdmin }
