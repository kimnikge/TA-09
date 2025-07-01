import { generateUUID } from '../src/utils/uuid';

console.log('Тестирование generateUUID:');

// Генерируем несколько UUID
for (let i = 0; i < 5; i++) {
  const uuid = generateUUID();
  console.log(`UUID ${i + 1}: ${uuid}`);
  
  // Проверяем формат UUID (версия 4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);
  console.log(`  Валидный: ${isValid}`);
}

console.log('\nТестирование завершено успешно!');
