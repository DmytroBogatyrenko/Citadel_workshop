import { useState, useEffect, } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Problems from './pages/Problems.jsx'
import AddProblem from './pages/AddProblem.jsx'
import AdminNewProblems from './pages/AdminNewProblems.jsx'
import AdminProblems from './pages/AdminProblems.jsx'
import AdminStats from './pages/AdminStats.jsx'
import CheckMessage from './pages/CheckMessage.jsx'
import ServiceComplete from './pages/ServiceComplete.jsx'
import ServiceCheck from './pages/ServiceCheck.jsx'
import Reviews from './pages/Reviews.jsx'
import Toast from './components/Toast.jsx'


function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [toast, setToast] = useState(null) // { message, type }
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setCurrentUser(null)
        setCheckingAuth(false)
        return
      }

      try {
        const response = await fetch('/api/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setCurrentUser({ username: data.username, role: data.role })
        } else {
          // Якщо токен застарів або недійсний
          localStorage.removeItem('token')
          setCurrentUser(null)
        }
      } catch {
        setCurrentUser(null)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  if (checkingAuth) {
    return <p style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>Завантаження...</p>
  }

  return (
    <>
          <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} />
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
          <main className="page-main">
        <Routes>
          <Route path="/" element={<Home currentUser={currentUser} />} />
          <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
          <Route path="/problems" element={<Problems currentUser={currentUser} />} />
          <Route path="/add-problem" element={<AddProblem currentUser={currentUser} />} />
          <Route path="/admin/new" element={<AdminNewProblems currentUser={currentUser} setToast={setToast} />} />
          <Route path="/admin/working" element={<AdminProblems currentUser={currentUser} setToast={setToast} />} />
          <Route path="/admin/stats" element={<AdminStats currentUser={currentUser} setToast={setToast} />} />
          <Route path="/check-message" element={<CheckMessage currentUser={currentUser} />} />
          <Route path="/service-complete" element={<ServiceComplete currentUser={currentUser} />} />
          <Route path="/service-check" element={<ServiceCheck currentUser={currentUser} />} />
          <Route path="/reviews" element={<Reviews currentUser={currentUser} />} />
        </Routes>
      </main>
      <footer className="site-footer">
        © 2026 Орден Цитаделі Майстерні. Всі права захищені мечем та законом гоя.
      </footer>
    </>
  )
}

export default App