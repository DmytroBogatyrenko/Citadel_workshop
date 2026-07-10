import { Link } from 'react-router-dom'

function Home({ currentUser }) {
  return (
    <div className="home-wrap">
      <div className="hero-card">
        <span className="crest">⚜️</span>
        <h1 className="hero-title">Цитадель Ордену</h1>
        <p className="hero-sub">Офіційний центр сервісного обслуговування</p>
        <div className="hero-divider"></div>
        <p className="hero-desc">
          Портал для подачі та відстеження сервісних звернень. Гільдія майстрів опрацює вашу заявку, надасть відповідь та видасть гарантійний документ після завершення робіт.
        </p>
        <div className="hero-btns">
          <Link to="/add-problem" className="btn">📜 Подати заявку</Link>
          <Link to="/problems" className="btn btn-ghost">📋 Мої заявки</Link>

          < a href="https://t.me/citadel_service_order_Bot/citadel"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-tg"
          >
            ✈️ Відкрити в Telegram
          </a>
        </div>
      </div>

      <div className="qa-card">
        <h3>👤 Для клієнтів</h3>
        <Link to="/add-problem" className="qa-link">
          <span className="qa-link-icon">📜</span>
          <span className="qa-link-body">
            <span className="qa-link-title">Нова заявка</span>
            <span className="qa-link-hint">Опишіть проблему майстрам</span>
          </span>
          <span className="qa-link-arrow">›</span>
        </Link>
        <Link to="/problems" className="qa-link">
          <span className="qa-link-icon">📋</span>
          <span className="qa-link-body">
            <span className="qa-link-title">Мої заявки</span>
            <span className="qa-link-hint">Відслідковуйте статус</span>
          </span>
          <span className="qa-link-arrow">›</span>
        </Link>
        {!currentUser && (
          <Link to="/login" className="qa-link">
            <span className="qa-link-icon">📝</span>
            <span className="qa-link-body">
              <span className="qa-link-title">Реєстрація / Вхід</span>
              <span className="qa-link-hint">Приєднатися до порталу</span>
            </span>
            <span className="qa-link-arrow">›</span>
          </Link>
        )}
      </div>

      <div className="qa-card">
        <h3>⚔ Для адміністрації</h3>
        <Link to="/admin/new" className="qa-link">
          <span className="qa-link-icon">⚡</span>
          <span className="qa-link-body">
            <span className="qa-link-title">Нові клопотання</span>
            <span className="qa-link-hint">Вхідні необроблені заявки</span>
          </span>
          <span className="qa-link-arrow">›</span>
        </Link>
        <Link to="/admin/working" className="qa-link">
          <span className="qa-link-icon">⚔</span>
          <span className="qa-link-body">
            <span className="qa-link-title">У роботі</span>
            <span className="qa-link-hint">Активні справи магістрів</span>
          </span>
          <span className="qa-link-arrow">›</span>
        </Link>
        <Link to="/admin/stats" className="qa-link">
          <span className="qa-link-icon">📊</span>
          <span className="qa-link-body">
            <span className="qa-link-title">Аналітика</span>
            <span className="qa-link-hint">Звіт та статистика</span>
          </span>
          <span className="qa-link-arrow">›</span>
        </Link>
      </div>

      <div className="steps-card">
        <h3>⚙ Як це працює</h3>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-num">01</div>
            <div className="step-icon">📝</div>
            <div className="step-label">Реєстрація</div>
            <div className="step-desc">Створіть акаунт на порталі</div>
          </div>
          <div className="step-item">
            <div className="step-num">02</div>
            <div className="step-icon">📜</div>
            <div className="step-label">Подача заявки</div>
            <div className="step-desc">Опишіть проблему, додайте фото</div>
          </div>
          <div className="step-item">
            <div className="step-num">03</div>
            <div className="step-icon">🔔</div>
            <div className="step-label">Сповіщення</div>
            <div className="step-desc">Telegram-бот надішле оновлення</div>
          </div>
          <div className="step-item">
            <div className="step-num">04</div>
            <div className="step-icon">⚔</div>
            <div className="step-label">Обробка</div>
            <div className="step-desc">Майстер бере справу в роботу</div>
          </div>
          <div className="step-item">
            <div className="step-num">05</div>
            <div className="step-icon">✅</div>
            <div className="step-label">Завершення</div>
            <div className="step-desc">Видається гарантійний талон</div>
          </div>
        </div>
      </div>

      <div className="info-chips">
        <span className="chip"><span className="chip-dot"></span> Гарантія 180 днів</span>
        <span className="chip"><span className="chip-dot"></span> Telegram-сповіщення</span>
        <span className="chip"><span className="chip-dot"></span> Робота 09:00 – 18:00</span>
        <span className="chip"><span className="chip-dot"></span> Фото до заявки</span>
        <span className="chip"><span className="chip-dot"></span> Захист даних</span>
      </div>
    </div>
  )
}

export default Home