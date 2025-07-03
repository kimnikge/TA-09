import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkClientsStructure() {
  console.log('🔍 Проверка структуры таблицы clients...');
  console.log('=' .repeat(50));

  try {
    // Проверяем структуру таблицы clients
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка:', error.message);
      return;
    }

    console.log('✅ Таблица clients доступна');
    
    // Пробуем получить несколько записей для понимания структуры
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.error('❌ Ошибка получения клиентов:', clientsError.message);
      return;
    }

    console.log(`📊 Найдено клиентов в базе: ${clients?.length || 0}`);
    
    if (clients && clients.length > 0) {
      console.log('\n📋 Структура записи клиента:');
      const firstClient = clients[0];
      Object.keys(firstClient).forEach(key => {
        console.log(`   ${key}: ${typeof firstClient[key]} (${firstClient[key]})`);
      });
      
      console.log('\n📝 Все клиенты:');
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} - ${client.address}`);
      });
    } else {
      console.log('📝 Таблица клиентов пуста');
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }
}

checkClientsStructure();
