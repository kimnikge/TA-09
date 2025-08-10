/**
 * Enum для ролей пользователей в системе
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SALES_REP = 'sales_rep'
}

/**
 * Константы для статуса одобрения пользователя
 */
export const UserApprovalStatus = {
  PENDING: false,
  APPROVED: true
} as const;

export type UserApprovalStatusType = typeof UserApprovalStatus[keyof typeof UserApprovalStatus];

/**
 * Улучшенный интерфейс профиля пользователя с типизацией
 */
export interface UserProfile {
  id: string;                    // Обязательное поле - ID пользователя
  email: string;                 // Обязательное поле - email пользователя  
  role: UserRole;               // Обязательное поле - роль с enum
  approved: boolean;            // Обязательное поле - статус одобрения
  name?: string;                // Опциональное - имя пользователя
  full_name?: string;           // Опциональное - полное имя
  created_at?: string;          // Опциональное - дата создания
}

/**
 * Тип для создания нового пользователя (без id и created_at)
 */
export interface CreateUserProfile {
  email: string;
  role: UserRole;
  approved: boolean;
  name?: string;
  full_name?: string;
}

/**
 * Тип для обновления пользователя (все поля опциональны кроме id)
 */
export interface UpdateUserProfile {
  id: string;
  email?: string;
  role?: UserRole;
  approved?: boolean;
  name?: string;
  full_name?: string;
}

/**
 * Utility функция для создания пользователя с дефолтными значениями
 */
export const createUserWithDefaults = (
  id: string, 
  email: string, 
  overrides?: Partial<UserProfile>
): UserProfile => {
  return {
    id,
    email,
    role: UserRole.USER,
    approved: UserApprovalStatus.PENDING,
    ...overrides
  };
};

/**
 * Type guard для проверки корректности UserRole
 */
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

/**
 * Type guard для проверки полноты UserProfile
 */
export const isCompleteUserProfile = (user: Partial<UserProfile>): user is UserProfile => {
  return Boolean(
    user.id && 
    user.email && 
    user.role !== undefined && 
    user.approved !== undefined
  );
};
