function Toast({ message, type = 'error', onClose }) {
  if (!message) return null

  const icons = { warn: '⚠️', error: '🚫', success: '✅', info: 'ℹ️' }

  return (
    <div className={`toast toast-${type}`} role="alert" onClick={onClose}>
      <span className="toast-icon">{icons[type] || '⚠️'}</span>
      <span className="toast-msg">{message}</span>
      <span className="toast-close">✕</span>
    </div>
  )
}

export default Toast