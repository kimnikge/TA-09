import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSetupDatabase() {
  console.log('🔍 Проверка и настройка базы данных...\n');

  try {
    // 1. Проверяем существующие таблицы
    console.log('1. Проверка существующих таблиц...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      console.log('   Не удалось получить список таблиц через RPC, попробуем другой способ...');
      
      // Альтернативный способ - попробуем запросить известные таблицы
      const tablesToCheck = ['users', 'clients', 'products', 'orders'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (error) {
            console.log(`   ❌ Таблица "${tableName}" не существует:`, error.message);
          } else {
            console.log(`   ✅ Таблица "${tableName}" существует`);
          }
        } catch (e) {
          console.log(`   ❌ Ошибка при проверке таблицы "${tableName}":`, e);
        }
      }
    } else {
      console.log('✅ Найденные таблицы:', tables);
    }

    console.log('\n2. Попытка создания таблицы users...');
    
    // Создаем таблицу users
    const createUsersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'sales_rep' CHECK (role IN ('admin', 'sales_rep')),
        approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createUsersError } = await supabase.rpc('exec_sql', { sql: createUsersSQL });
    
    if (createUsersError) {
      console.log('   Не удалось создать таблицу через RPC, попробуем другой способ...');
      console.log('   Ошибка:', createUsersError);
    } else {
      console.log('   ✅ Таблица users создана успешно');
    }

    console.log('\n3. Проверка таблицы clients...');
    
    const { error: clientsCheckError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsCheckError) {
      console.log('   ❌ Таблица clients не существует:', clientsCheckError.message);
      
      // Попробуем создать таблицу clients
      const createClientsSQL = `
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255),
          seller_name VARCHAR(255),
          address TEXT,
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error: createClientsError } = await supabase.rpc('exec_sql', { sql: createClientsSQL });
      
      if (createClientsError) {
        console.log('   ❌ Не удалось создать таблицу clients:', createClientsError);
      } else {
        console.log('   ✅ Таблица clients создана успешно');
      }
    } else {
      console.log('   ✅ Таблица clients существует');
    }

    console.log('\n4. Проверка наличия тестовых данных...');
    
    // Проверяем, есть ли уже тестовые пользователи
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.log('   ❌ Ошибка при проверке пользователей:', usersError.message);
    } else {
      console.log(`   📊 Найдено пользователей: ${existingUsers?.length || 0}`);
      
      if (existingUsers && existingUsers.length > 0) {
        existingUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.role}) - ${user.email}`);
        });
      }
    }

    // Проверяем клиентов
    const { data: existingClients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      console.log('   ❌ Ошибка при проверке клиентов:', clientsError.message);
    } else {
      console.log(`   📊 Найдено клиентов: ${existingClients?.length || 0}`);
      
      if (existingClients && existingClients.length > 0) {
        existingClients.forEach((client, index) => {
          console.log(`      ${index + 1}. ${client.name} (${client.company_name})`);
        });
      }
    }

    console.log('\n🎉 Проверка базы данных завершена!');

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

checkAndSetupDatabase();
