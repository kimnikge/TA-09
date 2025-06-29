import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateAdminProfile() {
  console.log('🔧 Обновление профиля администратора...')
  
  try {
    // Находим администратора
    const { data: admin, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .single()
    
    if (findError) {
      console.error('❌ Администратор не найден:', findError.message)
      return
    }
    
    console.log('👤 Найден администратор:', admin.id)
    
    // Обновляем профиль администратора
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        email: 'admin@company.com',
        name: 'Администратор',
        role: 'admin',
        approved: true
      })
      .eq('id', admin.id)
    
    if (updateError) {
      console.error('❌ Ошибка обновления профиля:', updateError.message)
    } else {
      console.log('✅ Профиль администратора обновлен!')
      console.log('📧 Email: admin@company.com')
      console.log('👤 Имя: Администратор')
      console.log('🔑 Роль: admin')
      console.log('✅ Статус: Одобрен')
      console.log('')
      console.log('🔄 Перезагрузите страницу в браузере, чтобы увидеть изменения')
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

updateAdminProfile()

export { updateAdminProfile }
