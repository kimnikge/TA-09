import { supabase } from './supabaseClient'

export async function handleRegister() {
  const email = prompt('Введите ваш email для регистрации:') || ''
  const password = prompt('Придумайте пароль:') || ''
  if (!email || !password) return 'empty'
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    return 'error:' + error.message
  } else {
    return 'success'
  }
}

export async function handleLogin() {
  const email = prompt('Введите ваш email для входа:') || ''
  const password = prompt('Введите пароль:') || ''
  if (!email || !password) return 'empty'
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return 'error:' + error.message
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('approved')
    .eq('id', data.user.id)
    .single()
  if (profileError) {
    return 'error:' + profileError.message
  }
  if (!profile?.approved) {
    await supabase.auth.signOut()
    return 'not_approved'
  }
  return 'login_success'
}
