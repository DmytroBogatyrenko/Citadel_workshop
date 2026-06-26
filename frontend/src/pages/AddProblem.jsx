import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function AddProblem({ currentUser }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const [aiLoading, setAiLoading] = useState(false)
  const [aiData, setAiData] = useState(null)

  if (!currentUser) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p>Спочатку увійдіть.</p>
        <Link to="/login" className="btn btn-ghost" style={{ width: 'auto', display: 'inline-block' }}>Перейти до входу</Link>
      </div>
    )
  }

  const handleAskAi = async () => {
    const text = description.trim()
    if (text.length < 10) {
      alert('Будь ласка, напишіть хоча б кілька слів у детальному описі, щоб ШІ мав що аналізувати!')
      return
    }

    setAiLoading(true)
    setAiData(null)

    try {
      const response = await fetch('https://citadelworkshop.duckdns.org/api/analyze_ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ description: text }),
      })

      if (response.status === 401) {
        alert('Помилка доступу. Будь ласка, увійдіть у свій акаунт заново.')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        alert('Помилка Асистента: ' + (errorData.detail || 'Не вдалося отримати відповідь'))
        return
      }

      const data = await response.json()
      setAiData(data)
    } catch {
      alert("Не вдалося зв'язатися з сервером аналізу.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleApplyAi = () => {
    if (aiData && aiData.corrected_text) {
      setDescription(aiData.corrected_text)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    if (file) {
      formData.append('img', file)
    }

    try {
      const response = await fetch('https://citadelworkshop.duckdns.org/api/add_problem', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`Помилка: ${data.detail}`)
        return
      }

      navigate('/problems')
    } catch {
      setMessage('Не вдалося з\'єднатись із сервером')
    }
  }

  return (
    <div className="card card-md">
      <h2>📜 Створення Клопотання</h2>
      {message && <div className="msg msg-error">{message}</div>}

      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Коротка суть проблеми</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Опишіть проблему одним реченням"
          required
        />

        <label htmlFor="description">Детальний опис</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Надайте якомога більше деталей: що сталося, коли, які симптоми..."
          className="textarea-large"
          required
        />

        <div className="ai-button-wrapper">
          <button type="button" className="ai-button" onClick={handleAskAi} disabled={aiLoading}>
            {aiLoading ? '🔮 Магічні алгоритми думають...' : '✨ Покликати ШІ-Помічника Магістрів'}
          </button>
        </div>

        {aiData && (
          <div className="ai-response-box" style={{ display: 'block' }}>
            <h4 className="ai-response-heading">🔮 Пророцтво та поради Асистента:</h4>

            <div className="ai-response-subsection">
              <p className="ai-response-subsection-label">📝 Шляхетний опис (без помилок):</p>
              <p className="ai-response-corrected-text">{aiData.corrected_text}</p>
              <button type="button" className="ai-apply-btn" onClick={handleApplyAi}>
                📜 Застосувати цей опис
              </button>
            </div>

            <div className="ai-response-section">
              <p className="ai-response-section-label">💡 Що можна вдіяти самостійно:</p>
              <ul className="ai-response-list">
                {aiData.solutions && aiData.solutions.length > 0 ? (
                  aiData.solutions.map((sol, i) => <li key={i}>{sol}</li>)
                ) : (
                  <li>Варіантів для самостійного виправлення не знайдено.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="ai-questions-label">❓ Таємні уточнення (додайте у текст, якщо знаєте):</p>
              <ul className="ai-questions-list">
                {aiData.questions && aiData.questions.length > 0 ? (
                  aiData.questions.map((q, i) => <li key={i}>{q}</li>)
                ) : (
                  <li>Додаткових питань немає, опис досконалий!</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <label htmlFor="img">Прикріпити файл (необов'язково)</label>
        <input
          id="img"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <p className="file-hint">Дозволені формати: jpg, png, gif, webp, pdf</p>

        <button type="submit">📤 Відправити Магістрам</button>
      </form>
    </div>
  )
}

export default AddProblem