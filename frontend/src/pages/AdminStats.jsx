import { useState, useEffect } from 'react'
import { useNavigate as useNav } from 'react-router-dom'

function AdminStats({ currentUser, setToast }) {
  const [stats, setStats] = useState(null)
  const [activeCount, setActiveCount] = useState(0)
  const [avgTime, setAvgTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNav()

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setToast({ message: 'Ця зала лише для Магістрів Ордену!', type: 'error' })
      navigate('/')
    }
  }, [currentUser, navigate, setToast])

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return

    const fetchStats = async () => {
      try {
        const response = await fetch('https://citadelworkshop.duckdns.org/api/admin_stats', {
          credentials: 'include',
        })
        if (!response.ok) {
          setError('Не вдалося завантажити статистику')
          setLoading(false)
          return
        }
        const data = await response.json()
        setStats(data.stats)
        setActiveCount(data.active_count)
        setAvgTime(data.avg_time)
        setLoading(false)
      } catch{
        setError('Помилка з\'єднання з сервером')
        setLoading(false)
      }
    }

    fetchStats()
  }, [currentUser])

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  const total = stats ? stats['В обробці'] + stats['У роботі'] + stats['Є відповідь'] + stats['Завершено'] : 0
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <div className="card card-wide stats-page">
      <h2>📊 Звіт Магістрів Аналітики</h2>

      {loading && <p>Завантаження...</p>}
      {error && <div className="msg msg-error">{error}</div>}

      {!loading && !error && stats && (
        <>
          <div className="stats-hero-grid">
            <div className="stats-hero-card stats-hero-gold">
              <div className="stats-hero-icon">📈</div>
              <div className="stats-hero-label">Активні прохання</div>
              <div className="stats-hero-value">{activeCount}</div>
            </div>
            <div className="stats-hero-card stats-hero-blue">
              <div className="stats-hero-icon">⏱</div>
              <div className="stats-hero-label">Середній час закриття</div>
              <div className="stats-hero-value stats-hero-value-text">{avgTime}</div>
            </div>
            <div className="stats-hero-card stats-hero-green">
              <div className="stats-hero-icon">✅</div>
              <div className="stats-hero-label">Завершено всього</div>
              <div className="stats-hero-value">{stats['Завершено']}</div>
            </div>
          </div>

          <h3 className="stats-breakdown-title">Розподіл за статусами</h3>

          <div className="stats-bars">
            <div className="stats-bar-row">
              <div className="stats-bar-label">
                <span className="stats-bar-dot dot-pending"></span> В обробці
                <span className="stats-bar-count">{stats['В обробці']}</span>
              </div>
              <div className="stats-bar-track">
                <div className="stats-bar-fill fill-pending" style={{ width: `${pct(stats['В обробці'])}%` }}></div>
              </div>
            </div>

            <div className="stats-bar-row">
              <div className="stats-bar-label">
                <span className="stats-bar-dot dot-working"></span> У роботі
                <span className="stats-bar-count">{stats['У роботі']}</span>
              </div>
              <div className="stats-bar-track">
                <div className="stats-bar-fill fill-working" style={{ width: `${pct(stats['У роботі'])}%` }}></div>
              </div>
            </div>

            <div className="stats-bar-row">
              <div className="stats-bar-label">
                <span className="stats-bar-dot dot-answered"></span> Є відповідь
                <span className="stats-bar-count">{stats['Є відповідь']}</span>
              </div>
              <div className="stats-bar-track">
                <div className="stats-bar-fill fill-answered" style={{ width: `${pct(stats['Є відповідь'])}%` }}></div>
              </div>
            </div>

            <div className="stats-bar-row">
              <div className="stats-bar-label">
                <span className="stats-bar-dot dot-done"></span> Завершено
                <span className="stats-bar-count">{stats['Завершено']}</span>
              </div>
              <div className="stats-bar-track">
                <div className="stats-bar-fill fill-done" style={{ width: `${pct(stats['Завершено'])}%` }}></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminStats