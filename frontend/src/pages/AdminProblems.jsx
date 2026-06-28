import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function AdminProblems({ currentUser }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answerText, setAnswerText] = useState({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return

    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/admin_problems', {
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

  const handleAnswer = async (problemId) => {
    const text = answerText[problemId]
    if (!text) return

    const formData = new FormData()
    formData.append('problem_id', problemId)
    formData.append('message', text)

    const response = await fetch('/api/add_answer', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    if (response.ok) {
      setMessage('Відповідь надіслана!')
      setProblems(problems.map((p) =>
        p.id === problemId ? { ...p, status: 'Є відповідь' } : p
      ))
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
        <h2>⚔ Справи під Вашим Контролем</h2>

        {loading && <p>Завантаження...</p>}
        {error && <div className="msg msg-error">{error}</div>}
        {message && <div className="msg msg-success">{message}</div>}

        {!loading && !error && problems.length === 0 && (
        <div className="empty-state">
            <div className="icon">📭</div>
            <p>Немає активних справ</p>
        </div>
        )}

        {!loading && !error && problems.length > 0 && (
        <div className="table-wrap">
            <table>
            <thead><tr><th>#ID</th><th>Назва</th><th>Дії</th></tr></thead>
            <tbody>
                {problems.map((p) => (
                <tr key={p.id}>
                    <td className="problem-id">#{p.id}</td>
                    <td className="problem-title">{p.title}</td>
                    <td className="problem-actions-row">
                    {p.status === 'У роботі' ? (
                        <>
                        <textarea
                            placeholder="Напишіть відповідь..."
                            value={answerText[p.id] || ''}
                            onChange={(e) => setAnswerText({ ...answerText, [p.id]: e.target.value })}
                            style={{ width: '100%', minHeight: '60px', marginBottom: '6px' }}
                        />
                        <button onClick={() => handleAnswer(p.id)} className="btn btn-sm btn-ghost">💬 Відповідь</button>
                        <Link to={`/service-complete?problem_id=${p.id}`} className="btn btn-sm btn-success">📄 Талон</Link>
                        </>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
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

export default AdminProblems