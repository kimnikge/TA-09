import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://olutrxiazrmanrgzzwmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Проверяем структуру базы данных...\n');

  try {
    // Проверяем каждую таблицу напрямую
    const tablesToCheck = ['products', 'clients', 'orders', 'order_items', 'profiles'];
    
    for (const tableName of tablesToCheck) {
      console.log(`🔍 Проверяем таблицу: ${tableName}`);
      
      try {
        // Пробуем получить данные из таблицы чтобы понять её структуру
        const { data: sampleData, error: dataError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (dataError) {
          console.log(`  ❌ Таблица ${tableName} не существует или недоступна:`, dataError.message);
          console.log(`     Код ошибки: ${dataError.code}`);
        } else {
          console.log(`  ✅ Таблица ${tableName} существует и доступна`);
          if (sampleData && sampleData.length > 0) {
            console.log(`  📝 Структура (на основе первой записи):`);
            const firstRecord = sampleData[0];
            Object.entries(firstRecord).forEach(([key, value]) => {
              const valueType = typeof value;
              const displayValue = value === null ? 'null' : String(value).substring(0, 50);
              console.log(`     - ${key}: ${valueType} (${displayValue})`);
            });
          } else {
            console.log(`  📝 Таблица пустая`);
          }
          
          // Получаем количество записей
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!countError) {
            console.log(`  📊 Количество записей: ${count}`);
          }
        }
      } catch (tableError) {
        console.log(`  ❌ Ошибка при проверке таблицы ${tableName}:`, tableError);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

// Запускаем проверку
checkDatabaseStructure()
  .then(() => {
    console.log('\n✅ Проверка завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка при проверке:', error);
    process.exit(1);
  });
