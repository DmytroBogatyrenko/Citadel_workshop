import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

function ServiceCheck({ currentUser }) {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const [problem, setProblem] = useState(null)
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser || !id) return

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/service_record_review?id=${id}`, {
          credentials: 'include',
        })
        if (!response.ok) {
          setError('Гарантійний талон не знайдено')
          setLoading(false)
          return
        }
        const data = await response.json()
        setProblem(data.problem)
        setRecord(data.service_record)
        setLoading(false)
      } catch (err) {
        console.error(err)
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
    <div className="card card-md">
        <h2>🎖 Гарантійний Талон</h2>

        {loading && <p>Завантаження...</p>}
        {error && <div className="msg msg-error">{error}</div>}

        {!loading && !error && problem && record && (
        <>
            <h3 style={{ textAlign: 'center' }}>{problem.title}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span className={`badge badge-${problem.status === 'Завершено' ? 'done' : 'pending'}`}>{problem.status}</span>
            </div>

            <h4>📋 Опис виконаної роботи</h4>
            <div className="service-detail">{record.work_done}</div>

            <h4>🔧 Використані ресурси</h4>
            <div className="service-detail">{record.parts_used}</div>

            <h4>🛡 Гарантійна інформація</h4>
            <pre className="warranty-block">{record.warranty_info}</pre>
        </>
        )}
    </div>
    )
}

export default ServiceCheck