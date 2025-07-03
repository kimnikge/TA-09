#!/bin/bash

echo "🚀 Netlify Deploy Script"
echo "========================"

# Проверяем переменные окружения
echo "📋 Environment Check:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "Branch: ${BRANCH:-'unknown'}"
echo "Context: ${CONTEXT:-'unknown'}"

# Переходим в папку frontend
cd frontend

echo ""
echo "📦 Installing dependencies..."
npm ci --silent

echo ""
echo "🔍 Checking project structure..."
ls -la

echo ""
echo "⚙️ Environment variables check..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    # Показываем только названия переменных (без значений)
    grep -o '^[^=]*' .env | head -5
else
    echo "❌ .env file not found"
fi

echo ""
echo "🏗️ Building project..."
npm run build

echo ""
echo "📊 Build result:"
if [ -d "dist" ]; then
    echo "✅ dist folder created"
    echo "📁 Build contents:"
    ls -la dist/
    echo ""
    echo "📏 File sizes:"
    du -sh dist/*
else
    echo "❌ dist folder not found - build failed!"
    exit 1
fi

echo ""
echo "🎉 Build completed successfully!"
