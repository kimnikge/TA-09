// Простой скрипт для проверки всех таблиц БД
// Вставьте этот код в консоль браузера на http://localhost:5174

(async function checkAllTables() {
    console.log('🔍 Проверяем все таблицы в базе данных...\n');
    
    // Список известных таблиц для проверки
    const tablesToCheck = [
        'clients', 
        'products', 
        'orders',
        'users',
        'categories',
        'inventory',
        'sales',
        'order_items'
    ];
    
    const results = {};
    
    for (const tableName of tablesToCheck) {
        try {
            console.log(`📋 Проверяем таблицу: ${tableName}`);
            
            // Пытаемся получить одну запись
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`❌ Таблица ${tableName} не существует`);
                    results[tableName] = { exists: false, error: error.message };
                } else {
                    console.log(`⚠️ Ошибка доступа к ${tableName}:`, error.message);
                    results[tableName] = { exists: true, error: error.message, columns: null };
                }
            } else {
                console.log(`✅ Таблица ${tableName} доступна`);
                
                if (data && data.length > 0) {
                    const columns = Object.keys(data[0]);
                    console.log(`📊 Колонки в ${tableName}:`, columns);
                    results[tableName] = { exists: true, columns: columns, sampleData: data[0] };
                } else {
                    console.log(`📊 Таблица ${tableName} пуста, пытаемся определить структуру...`);
                    
                    // Пытаемся сделать тестовый insert для получения ошибки со структурой
                    const testResult = await supabase
                        .from(tableName)
                        .insert({})
                        .select();
                    
                    results[tableName] = { 
                        exists: true, 
                        columns: null, 
                        isEmpty: true,
                        insertError: testResult.error?.message 
                    };
                }
            }
            
        } catch (error) {
            console.log(`💥 Ошибка при проверке ${tableName}:`, error.message);
            results[tableName] = { exists: false, error: error.message };
        }
        
        console.log('---');
    }
    
    console.log('\n📋 ИТОГОВАЯ СВОДКА:');
    console.log('==================');
    
    Object.entries(results).forEach(([tableName, info]) => {
        if (info.exists) {
            console.log(`✅ ${tableName}:`);
            if (info.columns) {
                console.log(`   Колонки: ${info.columns.join(', ')}`);
            }
            if (info.isEmpty) {
                console.log(`   Статус: таблица пуста`);
            }
            if (info.error) {
                console.log(`   Ошибка: ${info.error}`);
            }
        } else {
            console.log(`❌ ${tableName}: не существует`);
        }
    });
    
    return results;
})();
