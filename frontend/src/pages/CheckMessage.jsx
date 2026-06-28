import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

function CheckMessage({ currentUser }) {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const [problem, setProblem] = useState(null)
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser || !id) return

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/check_message?id=${id}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          setError('Не вдалося завантажити заявку')
          setLoading(false)
          return
        }
        const data = await response.json()
        setProblem(data.problem)
        setAnswer(data.answer)
        setLoading(false)
      } catch {
        setError('Помилка з\'єднання з сервером')
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, id])

    if (!currentUser) {
    return (
        <div className="card" style={{ textAlign: 'center' }}>
        <p>Спочатку увійдіть.</p>
        <Link to="/login" className="btn btn-ghost" style={{ width: 'auto', display: 'inline-block' }}>Перейти до входу</Link>
        </div>
    )
    }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>Деталі запиту</h1>

      {loading && <p>Завантаження...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && problem && (
        <>
          <h3>{problem.title}</h3>
          <p>{problem.description}</p>
          <p>Статус: <b>{problem.status}</b></p>

          <hr />
          <h4>Відповідь адміністрації</h4>
          {answer ? (
            <p style={{ background: '#e8f5e9', padding: '10px', borderRadius: '6px' }}>
              {answer.message}
            </p>
          ) : (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              Магістри ще вивчають матеріали справи...
            </p>
          )}
        </>
      )}

      <p style={{ marginTop: '20px' }}><Link to="/problems">← До моїх заявок</Link></p>
    </div>
  )
}

export default CheckMessage