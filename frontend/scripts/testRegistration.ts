import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Читаем .env файл
const envPath = path.join(process.cwd(), '.env')
const envFile = fs.readFileSync(envPath, 'utf8')

const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  env.VITE_SUPABASE_URL || 'http://localhost:54321',
  env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
)

async function testRegistration() {
  console.log('🧪 Тестируем регистрацию админа...')
  
  const adminEmail = 'test.admin@gmail.com'
  const adminPassword = 'admin123'
  const adminName = 'Администратор'
  
  try {
    // Пробуем зарегистрировать админа
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          name: adminName
        }
      }
    })
    
    if (authError) {
      console.log('❌ Ошибка регистрации:', authError.message)
      
      // Возможно, пользователь уже существует, попробуем войти
      console.log('🔄 Пробуем войти...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      })
      
      if (loginError) {
        console.log('❌ Ошибка входа:', loginError.message)
      } else {
        console.log('✅ Вход выполнен успешно')
        
        // Создаем/обновляем профиль
        if (loginData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: loginData.user.id,
              email: adminEmail,
              name: adminName,
              role: 'admin',
              approved: true
            })
          
          if (profileError) {
            console.log('❌ Ошибка создания профиля:', profileError.message)
          } else {
            console.log('✅ Профиль администратора создан/обновлен')
          }
        }
      }
    } else {
      console.log('✅ Регистрация успешна')
      
      if (authData.user) {
        // Создаем профиль
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: adminEmail,
            name: adminName,
            role: 'admin',
            approved: true
          })
        
        if (profileError) {
          console.log('❌ Ошибка создания профиля:', profileError.message)
        } else {
          console.log('✅ Профиль администратора создан')
        }
      }
    }
    
    // Проверяем итоговое состояние
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
    
    if (profiles && profiles.length > 0) {
      console.log('📊 Найденный профиль админа:')
      console.log(profiles[0])
    }
    
    console.log('')
    console.log('🎉 Тестирование завершено!')
    console.log('📧 Email: admin@ta09.com')
    console.log('🔑 Пароль: admin123')
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error)
  }
}

testRegistration()
