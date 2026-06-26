import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import { useState } from 'react'
import MenuOverlay from './MenuOverlay.jsx'

function Navbar({ currentUser, setCurrentUser }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleMouseMove = (e) => {
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      el.style.setProperty('--rx', ((e.clientX - r.left) / r.width * 100) + '%')
      el.style.setProperty('--ry', ((e.clientY - r.top) / r.height * 100) + '%')
    }

    const elements = document.querySelectorAll('.nav-quick a, .btn, button[type=submit]')
    elements.forEach((el) => el.addEventListener('mousemove', handleMouseMove))

    return () => {
      elements.forEach((el) => el.removeEventListener('mousemove', handleMouseMove))
    }
  }, [location.pathname])

  const handleLogout = async () => {
    await fetch('https://citadelworkshop.duckdns.org/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setCurrentUser(null)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path ? 'active-link' : ''

  return (
    <>
      <div className="ticker-bar">
        <div className="ticker-label">⚜ НОВИНИ</div>
        <div className="ticker-track">
          <div className="ticker-inner">
            <span className="ticker-item"><span className="dot"></span> Подайте нову заявку через портал</span>
            <span className="ticker-item"><span className="dot"></span> Відслідковуйте статус вашої справи в особистому кабінеті</span>
            <span className="ticker-item"><span className="dot"></span> Після завершення ремонту видається гарантійний талон на 180 днів</span>
            <span className="ticker-item"><span className="dot"></span> Гільдія майстрів працює щодня з 09:00 до 18:00</span>
          </div>
        </div>
      </div>

      <div className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">
            <span className="logo-main">⚜ Цитадель</span>
            <span className="logo-sub">Центр Обслуговування</span>
          </Link>

          <nav className="nav-quick">
            <Link to="/" className={isActive('/')}>🏛 Головна</Link>
            <Link to="/problems" className={isActive('/problems')}>📋 Мої заявки</Link>
            <Link to="/reviews" className={isActive('/reviews')}>📖 Відгуки</Link>
            <span className="nav-sep"></span>
            <Link to="/admin/new" className={`admin-link ${isActive('/admin/new')}`}>⚡ Нові</Link>
            <Link to="/admin/working" className={`admin-link ${isActive('/admin/working')}`}>⚔ У роботі</Link>
            <Link to="/admin/stats" className={`admin-link ${isActive('/admin/stats')}`}>📊 Аналітика</Link>
            <span className="nav-sep"></span>

            {currentUser ? (
              <>
                <span className="user-pill">✅ Увійшли як <strong>{currentUser.username}</strong></span>
                <button className="btn-nav-logout" onClick={handleLogout}>🚪 Вийти</button>
              </>
            ) : (
              <>
                <Link to="/login">🔑 Вхід</Link>
                <Link to="/login">📝 Реєстрація</Link>
              </>
            )}
</nav>

          <button
            className={`burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Відкрити меню"
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>
        </div>
      </div>

      <MenuOverlay
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    </>
  )
}

export default Navbar