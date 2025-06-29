#!/bin/bash

echo "🔍 Проверка состояния проекта ТА-09"
echo "=================================="

# Проверка структуры проекта
echo ""
echo "📁 Структура проекта:"
echo "- frontend/src/pages: $(ls -1 frontend/src/pages | wc -l | xargs) файлов"
echo "- frontend/src/components: $(ls -1 frontend/src/components | wc -l | xargs) файлов"
echo "- Документация: $(ls -1 *.md | wc -l | xargs) файлов"

# Проверка зависимостей
echo ""
echo "📦 Зависимости:"
if [ -f "frontend/package.json" ]; then
    echo "✅ package.json найден"
    if [ -d "frontend/node_modules" ]; then
        echo "✅ node_modules установлены"
    else
        echo "❌ node_modules не найдены (запустите npm install)"
    fi
else
    echo "❌ package.json не найден"
fi

# Проверка конфигурации
echo ""
echo "⚙️ Конфигурация:"
if [ -f "frontend/.env" ]; then
    echo "✅ .env файл найден"
else
    echo "❌ .env файл не найден (скопируйте из .env.example)"
fi

# Проверка базы данных
echo ""
echo "🗄️ База данных:"
if [ -f "UPDATE_DATABASE.sql" ]; then
    echo "✅ SQL-скрипт для БД найден"
else
    echo "❌ SQL-скрипт для БД не найден"
fi

echo ""
echo "🚀 Для запуска проекта:"
echo "cd frontend && npm run dev"
