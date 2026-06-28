import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Reviews({ currentUser }) {
  const [reviews, setReviews] = useState([])
  const [canLeaveReview, setCanLeaveReview] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!currentUser) return

    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews', {
          credentials: 'include',
        })
        if (!response.ok) {
          setError('Не вдалося завантажити відгуки')
          setLoading(false)
          return
        }
        const data = await response.json()
        setReviews(data.reviews)
        setCanLeaveReview(data.can_leave_review)
        setLoading(false)
      } catch {
        setError('Помилка з\'єднання з сервером')
        setLoading(false)
      }
    }

    fetchReviews()
  }, [currentUser])

  if (!currentUser) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p>Спочатку увійдіть.</p>
        <Link to="/login" className="btn btn-ghost" style={{ width: 'auto', display: 'inline-block' }}>Перейти до входу</Link>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const formData = new FormData()
    formData.append('text', text)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setMessage(`Помилка: ${data.detail}`)
        return
      }

      setText('')
      const refreshed = await fetch('/api/reviews', { credentials: 'include' })
      const data = await refreshed.json()
      setReviews(data.reviews)
      setCanLeaveReview(data.can_leave_review)
    } catch {
      setMessage('Не вдалося з\'єднатись із сервером')
    }
  }

  return (
    <div className="card card-md">
      <h2>📖 Книга Відгуків Народу</h2>

      {canLeaveReview ? (
        <div className="review-form-container">
          <h3 className="review-form-title">✍ Залишити свій відгук</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              className="review-textarea"
              placeholder="Поділіться враженнями від сервісу..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
            <button type="submit" className="review-submit">📝 Записати в Книгу</button>
          </form>
          {message && <div className="msg msg-error">{message}</div>}
        </div>
      ) : (
        <div className="msg msg-info msg-info-review">
          ✍ Написати відгук можуть лише користувачі, що мають хоча б одну завершену заявку.
        </div>
      )}

      <h3 className="section-title">Всі записи</h3>

      {loading && <p>Завантаження...</p>}
      {error && <div className="msg msg-error">{error}</div>}

      {!loading && !error && reviews.length === 0 && (
        <div className="empty-reviews">
          <div className="empty-reviews-icon">📭</div>
          <p className="empty-reviews-text">Записів ще немає. Станьте першим!</p>
        </div>
      )}

      {!loading && !error && reviews.map((review) => (
        <div key={review.id} className="review-card">
          <p className="review-text">"{review.text}"</p>
          <div className="review-meta">Користувач #{review.user_id} &nbsp;·&nbsp; {review.date_created}</div>
        </div>
      ))}
    </div>
  )
}

export default Reviews