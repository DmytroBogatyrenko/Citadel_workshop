import { Link, useNavigate } from 'react-router-dom'

function MenuOverlay({ isOpen, onClose, currentUser, setCurrentUser }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await fetch('https://citadelworkshop.duckdns.org/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setCurrentUser(null)
    onClose()
    navigate('/')
  }

  const handleLinkClick = () => {
    onClose()
  }

  return (
    <div className={`overlay ${isOpen ? 'open' : ''}`}>
      <div className="overlay-bg" onClick={onClose}></div>
      <div className="overlay-deco"></div>
      <button className="overlay-close" onClick={onClose}>✕</button>

      <div className="overlay-content">
        <div className="overlay-logo">⚜ &nbsp; Цитадель Ордену &nbsp; ⚜</div>

        {currentUser && (
          <div className="overlay-user-block">
            <div className="overlay-user-avatar">
              {currentUser.role === 'admin' ? '⚔' : '👤'}
            </div>
            <div>
              <div className="overlay-user-name">
                {currentUser.role === 'admin' ? 'Адміністратор' : currentUser.username}
              </div>
              <div className="overlay-user-role">
                {currentUser.role === 'admin' ? 'Повний доступ' : 'Звичайний користувач'}
              </div>
            </div>
          </div>
        )}

        <Link to="/" className="overlay-item" onClick={handleLinkClick}>
          <span className="overlay-item-icon">🏛</span>
          <span className="overlay-item-text">Головна</span>
          <span className="overlay-item-desc">Портал</span>
        </Link>
        <Link to="/add-problem" className="overlay-item" onClick={handleLinkClick}>
          <span className="overlay-item-icon">📜</span>
          <span className="overlay-item-text">Нова заявка</span>
          <span className="overlay-item-desc">Клопотання</span>
        </Link>
        <Link to="/problems" className="overlay-item" onClick={handleLinkClick}>
          <span className="overlay-item-icon">📋</span>
          <span className="overlay-item-text">Мої заявки</span>
          <span className="overlay-item-desc">Кабінет</span>
        </Link>

        <div className="overlay-divider"></div>
        <div className="overlay-section">Адміністрація</div>

        <Link to="/admin/new" className="overlay-item is-admin" onClick={handleLinkClick}>
          <span className="overlay-item-icon">⚡</span>
          <span className="overlay-item-text">Нові клопотання</span>
          <span className="overlay-item-desc">Вхідні</span>
        </Link>
        <Link to="/admin/working" className="overlay-item is-admin" onClick={handleLinkClick}>
          <span className="overlay-item-icon">⚔</span>
          <span className="overlay-item-text">У роботі</span>
          <span className="overlay-item-desc">Активні</span>
        </Link>
        <Link to="/admin/stats" className="overlay-item is-admin" onClick={handleLinkClick}>
          <span className="overlay-item-icon">📊</span>
          <span className="overlay-item-text">Аналітика</span>
          <span className="overlay-item-desc">Звіт</span>
        </Link>

        <div className="overlay-divider"></div>

        {currentUser ? (
          <button className="overlay-logout-form-btn" onClick={handleLogout} style={{
            all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '14px', padding: '10px 40px', cursor: 'pointer', width: '100%', maxWidth: '420px',
          }}>
            <span className="btn-icon">🚪</span>
            <span className="btn-label">Вийти</span>
          </button>
        ) : (
          <>
            <Link to="/login" className="overlay-item" onClick={handleLinkClick}>
              <span className="overlay-item-icon">🔑</span>
              <span className="overlay-item-text">Вхід</span>
              <span className="overlay-item-desc">У покої</span>
            </Link>
            <Link to="/login" className="overlay-item" onClick={handleLinkClick}>
              <span className="overlay-item-icon">📝</span>
              <span className="overlay-item-text">Реєстрація</span>
              <span className="overlay-item-desc">Присяга</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default MenuOverlay