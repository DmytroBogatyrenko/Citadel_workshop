import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function statusClass(status) {
  const map = {
    'В обробці': 'pending',
    'У роботі': 'working',
    'Є відповідь': 'answered',
    'Завершено': 'done',
  }
  return map[status] || 'pending'
}

function Problems({ currentUser }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) return

    const fetchProblems = async () => {
      try {
        const response = await fetch('https://citadelworkshop.duckdns.org/api/my_problems', {
          credentials: 'include',
        })

        if (!response.ok) {
          setError('Не вдалося завантажити заявки')
          setLoading(false)
          return
        }

        const data = await response.json()
        setProblems(data)
        setLoading(false)
      } catch {
        setError('Помилка з\'єднання з сервером')
        setLoading(false)
      }
    }

    fetchProblems()
  }, [currentUser])

    if (!currentUser) {
    return (
        <div className="card" style={{ textAlign: 'center' }}>
        <p>Спочатку увійдіть.</p>
        <Link to="/login" className="btn btn-ghost" style={{ width: 'auto', display: 'inline-block' }}>Перейти до входу</Link>
        </div>
    )
    }

    return (
    <div className="card card-wide">
        <h2>📋 Мої Сувої</h2>

        {loading && <p>Завантаження...</p>}
        {error && <div className="msg msg-error">{error}</div>}

        {!loading && !error && problems.length === 0 && (
        <div className="empty-state">
            <div className="icon">📭</div>
            <p>Ви ще не подавали жодних заявок</p>
            <Link to="/add-problem" className="btn cta">Подати першу заявку</Link>
        </div>
        )}

        {!loading && !error && problems.length > 0 && (
        <div className="table-wrap">
            <table>
            <thead>
                <tr><th>Тема</th><th>Статус</th><th>Дії</th></tr>
            </thead>
            <tbody>
                {problems.map((p) => (
                <tr key={p.id}>
                    <td className="title-cell">{p.title}</td>
                    <td><span className={`badge badge-${statusClass(p.status)}`}>{p.status}</span></td>
                    <td>
                    <Link to={`/check-message?id=${p.id}`} className="btn btn-sm btn-ghost">👁 Переглянути</Link>
                    {p.status === 'Завершено' && (
                        <Link to={`/service-check?id=${p.id}`} className="btn btn-sm btn-success ml-6">📄 Талон</Link>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
    </div>
    )
}

export default Problems