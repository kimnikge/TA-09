import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function makeUserAdmin() {
  console.log('🔑 Назначение роли администратора для e.yugay.fregat@gmail.com...')
  console.log('=' .repeat(60))
  
  try {
    const targetEmail = 'e.yugay.fregat@gmail.com'
    
    // Находим пользователя по email
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', targetEmail)
      .single()
    
    if (findError) {
      console.error('❌ Пользователь не найден:', findError.message)
      return
    }
    
    console.log('👤 Найден пользователь:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Имя: ${user.name}`)
    console.log(`   Текущая роль: ${user.role}`)
    console.log(`   Текущий статус: ${user.approved ? 'Одобрен' : 'Заблокирован'}`)
    console.log('')
    
    // Обновляем роль на admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        approved: true
      })
      .eq('email', targetEmail)
    
    if (updateError) {
      console.error('❌ Ошибка обновления роли:', updateError.message)
    } else {
      console.log('✅ Роль успешно обновлена!')
      console.log('🔑 Новая роль: admin')
      console.log('✅ Статус: Одобрен')
      console.log('')
      console.log('🎉 Теперь у вас есть ДВА администратора:')
      console.log('   1. kimnikge@gmail.com')
      console.log('   2. e.yugay.fregat@gmail.com')
      console.log('')
      console.log('🔄 Перезагрузите страницу в браузере, чтобы увидеть изменения')
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

makeUserAdmin()

export { makeUserAdmin }
