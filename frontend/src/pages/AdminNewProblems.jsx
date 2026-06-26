import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function AdminNewProblems({ currentUser }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return

    const fetchProblems = async () => {
      try {
        const response = await fetch('https://citadelworkshop.duckdns.org/api/new_problems', {
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

  const handleTake = async (id) => {
    const formData = new FormData()
    formData.append('id', id)

    const response = await fetch('https://citadelworkshop.duckdns.org/api/take_problem', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (response.ok) {
      setProblems(problems.filter((p) => p.id !== id))
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Доступ лише для адміністраторів.</p>
        <Link to="/">На головну</Link>
      </div>
    )
  }

    return (
    <div className="card card-wide">
        <h2>⚡ Нові Клопотання від Народу</h2>

        {loading && <p>Завантаження...</p>}
        {error && <div className="msg msg-error">{error}</div>}

        {!loading && !error && problems.length === 0 && (
        <div className="empty-state">
            <div className="icon">✅</div>
            <p>Нових заявок немає</p>
        </div>
        )}

        {!loading && !error && problems.length > 0 && (
        <div className="table-wrap">
            <table>
            <thead><tr><th>#ID</th><th>Заголовок</th><th>Дія</th></tr></thead>
            <tbody>
                {problems.map((p) => (
                <tr key={p.id}>
                    <td className="problem-id">#{p.id}</td>
                    <td className="problem-title">{p.title}</td>
                    <td><button onClick={() => handleTake(p.id)} className="btn btn-sm">⚔ Взяти у роботу</button></td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
    </div>
    )
}

export default AdminNewProblems