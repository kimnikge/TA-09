#!/bin/bash

# Скрипт для сборки с переменными окружения
echo "🔧 Запуск сборки с переменными окружения..."

# Устанавливаем переменные окружения по умолчанию
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://olutrxiazrmanrgzzwmb.supabase.co}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdXRyeGlhenJtYW5yZ3p6d21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMwMjEsImV4cCI6MjA2NjQ0OTAyMX0.qxU_1Fjk4Mu9vMSfEI4jSGm3yYhh9WbmlSEFttOMKiM}"

echo "📍 VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "🔑 VITE_SUPABASE_ANON_KEY length: ${#VITE_SUPABASE_ANON_KEY}"

# Устанавливаем зависимости если нужно
echo "📦 Установка зависимостей..."
npm ci

# Запускаем сборку
echo "🏗️ Запуск сборки..."
npm run build
