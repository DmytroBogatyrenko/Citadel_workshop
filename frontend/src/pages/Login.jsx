import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ setCurrentUser }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(`Помилка: ${data.detail}`)
        return
      }

      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      setCurrentUser({ username: data.username, role: data.role })
      navigate('/')
    } catch {
      setMessage('Не вдалося з\'єднатись із сервером')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(`Помилка: ${data.detail}`)
        return
      }

      setMessage(`Реєстрація успішна! Telegram-код: ${data.tg_code}. Тепер увійдіть.`)
      setMode('login')
      setUsername(data.username)
      setPassword('')
    } catch {
      setMessage('Не вдалося з\'єднатись із сервером')
    }
  }

  return (
    <div className="card login-card">
        <h2>{mode === 'login' ? 'Вхід у Покої' : 'Присяга на Вірність'}</h2>

        <div className="mode-switch">
        <button
            type="button"
            className={`mode-switch-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setMessage('') }}
        >
            Вхід
        </button>
        <button
            type="button"
            className={`mode-switch-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setMessage('') }}
        >
            Реєстрація
        </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
        <label htmlFor="username">Ім'я користувача</label>
        <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введіть ваше ім'я"
            required
        />

        {mode === 'register' && (
            <>
            <label htmlFor="email">Електронна пошта</label>
            <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
            />
            </>
        )}

        <label htmlFor="password">Пароль</label>
        <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'login' ? '••••••••' : 'Мінімум 6 символів'}
            minLength={6}
            required
        />

        <button type="submit">{mode === 'login' ? 'Увійти' : 'Зареєструватися'}</button>
        </form>

        {message && <div className="msg msg-error">{message}</div>}

        <p className="login-footer">
        {mode === 'login' ? (
            <>Немає акаунту? <a onClick={() => setMode('register')} style={{ cursor: 'pointer' }}>Зареєструватися</a></>
        ) : (
            <>Вже є акаунт? <a onClick={() => setMode('login')} style={{ cursor: 'pointer' }}>Увійти</a></>
        )}
        </p>
    </div>
  )
}

export default Login