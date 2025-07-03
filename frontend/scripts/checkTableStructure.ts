import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Загружаем переменные окружения
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructures() {
  console.log('🔍 Проверка структуры таблиц...\n');

  try {
    // Проверяем таблицу profiles
    console.log('📊 Структура таблицы profiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Ошибка profiles:', profilesError);
    } else {
      if (profiles && profiles.length > 0) {
        console.log('Поля profiles:', Object.keys(profiles[0]));
      }
    }

    // Проверяем таблицу clients
    console.log('\n📊 Структура таблицы clients:');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (clientsError) {
      console.error('❌ Ошибка clients:', clientsError);
    } else {
      if (clients && clients.length > 0) {
        console.log('Поля clients:', Object.keys(clients[0]));
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkTableStructures();
