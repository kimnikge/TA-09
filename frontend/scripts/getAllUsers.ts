import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olutrxiazrmanrgzzwmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getAllUsers() {
  console.log('🔍 Получаем всех пользователей из базы данных...')
  console.log('=' .repeat(60))
  
  try {
    // 1. Получаем данные из таблицы profiles
    console.log('📋 Данные из таблицы PROFILES:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('❌ Ошибка получения profiles:', profilesError.message)
    } else {
      console.log(`Найдено записей в profiles: ${profiles?.length || 0}`)
      console.log('')
      
      profiles?.forEach((profile, index) => {
        console.log(`👤 Пользователь ${index + 1}:`)
        console.log(`   ID: ${profile.id}`)
        console.log(`   Email: ${profile.email || 'НЕ УКАЗАН'}`)
        console.log(`   Имя: ${profile.name || 'НЕ УКАЗАНО'}`)
        console.log(`   Роль: ${profile.role || 'НЕ УКАЗАНА'}`)
        console.log(`   Статус: ${profile.approved ? '✅ Одобрен' : '❌ Заблокирован'}`)
        console.log(`   Создан: ${profile.created_at ? new Date(profile.created_at).toLocaleString('ru-RU') : 'НЕ УКАЗАНО'}`)
        console.log('   ' + '-'.repeat(50))
      })
    }
    
    console.log('')
    console.log('🔍 Пытаемся получить данные аутентификации...')
    
    // 2. Попробуем получить данные текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('⚠️ Нет активной сессии пользователя')
    } else if (user) {
      console.log('👤 Текущий авторизованный пользователь:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email || 'НЕ УКАЗАН'}`)
      console.log(`   Создан: ${user.created_at ? new Date(user.created_at).toLocaleString('ru-RU') : 'НЕ УКАЗАНО'}`)
      console.log(`   Подтвержден: ${user.email_confirmed_at ? '✅ Да' : '❌ Нет'}`)
      console.log('')
    }
    
    // 3. Получаем данные сессии
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('⚠️ Ошибка получения сессии:', sessionError.message)
    } else if (session) {
      console.log('🔐 Активная сессия найдена')
      console.log(`   Пользователь: ${session.user.email}`)
      console.log(`   ID: ${session.user.id}`)
    } else {
      console.log('⚠️ Активной сессии нет')
    }
    
    console.log('')
    console.log('📊 ИТОГО:')
    console.log(`- Записей в profiles: ${profiles?.length || 0}`)
    console.log(`- Активная сессия: ${session ? '✅ Есть' : '❌ Нет'}`)
    console.log(`- Текущий пользователь: ${user?.email || 'НЕ АВТОРИЗОВАН'}`)
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

getAllUsers()

export { getAllUsers }
