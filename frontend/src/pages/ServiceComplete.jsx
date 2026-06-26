import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

function ServiceComplete({ currentUser }) {
  const [searchParams] = useSearchParams()
  const problemId = searchParams.get('problem_id')

  const [workDone, setWorkDone] = useState('')
  const [partsUsed, setPartsUsed] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

    if (!currentUser || currentUser.role !== 'admin') {
    return (
        <div className="card" style={{ textAlign: 'center' }}>
        <p>Доступ лише для адміністраторів.</p>
        <Link to="/" className="btn btn-ghost" style={{ width: 'auto', display: 'inline-block' }}>На головну</Link>
        </div>
    )
    }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const formData = new FormData()
    formData.append('work_done', workDone)
    formData.append('parts_used', partsUsed)
    formData.append('problem_id', problemId)

    try {
      const response = await fetch('https://citadelworkshop.duckdns.org/api/service_complete', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`Помилка: ${data.detail}`)
        return
      }

      navigate('/admin/working')
    } catch {
      setMessage('Не вдалося з\'єднатись із сервером')
    }
  }

    return (
    <div className="card card-md">
        <h2>📄 Акт Виконаних Робіт</h2>

        <form onSubmit={handleSubmit}>
        <label htmlFor="work_done">Виконаний обсяг робіт</label>
        <textarea
            id="work_done"
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            placeholder="Детально опишіть що було зроблено..."
            className="textarea-large"
            required
        />

        <label htmlFor="parts_used">Використані матеріали та ресурси</label>
        <textarea
            id="parts_used"
            value={partsUsed}
            onChange={(e) => setPartsUsed(e.target.value)}
            placeholder="Перелічіть матеріали, деталі, компоненти..."
            className="textarea-md"
            required
        />

        <button type="submit" className="btn-success">
            ✅ Завершити Справу та Видати Гарантію
        </button>
        </form>

        {message && <div className="msg msg-error">{message}</div>}
    </div>
    )
}

export default ServiceComplete