import type { User, Session } from '@supabase/supabase-js'
import { handleRegister, handleLogin } from '../src/auth'

// Мокаем prompt для тестов
global.prompt = jest.fn()

const mockUser: User = {
  id: 'user-1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@email.com',
  phone: undefined,
  role: 'authenticated',
  identities: [],
}

const mockSession: Session = {
  access_token: '',
  token_type: '',
  user: mockUser,
  expires_in: 0,
  refresh_token: '',
  provider_token: '',
  provider_refresh_token: '',
  expires_at: 0,
}


jest.mock('../src/supabaseClient', () => {
  const originalModule = jest.requireActual('../src/supabaseClient')
  return {
    ...originalModule,
    supabase: {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(() => ({ select: jest.fn() })),
    },
  }
})

describe('Регистрация и вход', () => {
  let supabase: typeof import('../src/supabaseClient').supabase
  beforeEach(() => {
    jest.clearAllMocks()
    supabase = require('../src/supabaseClient').supabase
  })

  it('успешная регистрация', async () => {
    (global.prompt as jest.Mock).mockReturnValueOnce('test@email.com');
    (global.prompt as jest.Mock).mockReturnValueOnce('password123');
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    const result = await handleRegister();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'test@email.com', password: 'password123' });
    expect(result).toBe('success');
  });

  it('отказ во входе, если не подтверждён', async () => {
    (global.prompt as jest.Mock).mockReturnValueOnce('test@email.com');
    (global.prompt as jest.Mock).mockReturnValueOnce('password123');
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: async () => ({ data: { approved: false }, error: null }) })) })) });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({});
    const result = await handleLogin();
    expect(result).toBe('not_approved');
  });

  it('успешный вход, если подтверждён', async () => {
    (global.prompt as jest.Mock).mockReturnValueOnce('test@email.com');
    (global.prompt as jest.Mock).mockReturnValueOnce('password123');
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: async () => ({ data: { approved: true }, error: null }) })) })) });
    const result = await handleLogin();
    expect(result).toBe('login_success');
  });
})
