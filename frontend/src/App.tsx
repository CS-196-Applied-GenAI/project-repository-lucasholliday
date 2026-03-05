import { AuthProvider } from './auth/AuthContext'
import { AppRouter } from './routes/Router'
import { ToastProvider } from './ui/toast'

function App() {
  return (
    <div className='min-h-screen text-[var(--text-primary)]'>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </div>
  )
}

export default App
