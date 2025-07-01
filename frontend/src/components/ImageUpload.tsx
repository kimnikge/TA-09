import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  bucketName?: string;
  maxSize?: number; // в мегабайтах
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  bucketName = 'product-images',
  maxSize = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка изображения в Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setError('');
      setUploading(true);

      // Проверка размера файла
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`Размер файла не должен превышать ${maxSize}MB`);
      }

      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        throw new Error('Файл должен быть изображением');
      }

      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Загружаем файл в Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      setError(error instanceof Error ? error.message : 'Ошибка загрузки изображения');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Удаление изображения из Storage
  const deleteImage = async (imageUrl: string) => {
    try {
      // Извлекаем путь к файлу из URL
      const urlParts = imageUrl.split(`/${bucketName}/`);
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Ошибка удаления изображения:', error);
      }
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
    }
  };

  // Обработка выбора файла
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      // Если было предыдущее изображение, удаляем его
      if (currentImageUrl) {
        await deleteImage(currentImageUrl);
      }
      onImageChange(imageUrl);
    }

    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Обработка удаления изображения
  const handleRemoveImage = async () => {
    if (currentImageUrl) {
      await deleteImage(currentImageUrl);
      onImageChange(null);
    }
  };

  // Обработка клика по области загрузки
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Изображение товара
      </label>

      {/* Текущее изображение или область загрузки */}
      <div className="relative">
        {currentImageUrl ? (
          // Отображение текущего изображения
          <div className="relative group">
            <img
              src={currentImageUrl}
              alt="Изображение товара"
              className="w-full h-32 object-cover rounded-lg border border-gray-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  title="Заменить изображение"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  title="Удалить изображение"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Область загрузки
          <div
            onClick={handleUploadClick}
            className={`
              w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center
              cursor-pointer transition-colors
              ${uploading 
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1" />
                <p className="text-xs text-gray-600">Загрузка...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                <p className="text-xs text-gray-600 mb-1">Нажмите для загрузки</p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP до {maxSize}MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Подсказка */}
      <p className="text-xs text-gray-500">
        Рекомендуемый размер: 400x400px. Поддерживаемые форматы: JPG, PNG, WEBP
      </p>
    </div>
  );
};

export default ImageUpload;
