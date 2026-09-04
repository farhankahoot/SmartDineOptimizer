import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from '@/auth/AuthContext'
import { ReservationsProvider } from '@/store/ReservationsContext'
import { SystemProvider } from '@/store/SystemContext'
import { UsersProvider } from '@/store/UsersContext'
import { PlatformProvider } from '@/store/PlatformContext'
import { ToastProvider } from '@/components/ui/Toast'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/*
        Order matters: system switches gate sign-in, and every data store
        reloads when the signed-in user changes, so auth sits above them.
      */}
      <SystemProvider>
        <AuthProvider>
          <UsersProvider>
            <ReservationsProvider>
              <PlatformProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </PlatformProvider>
            </ReservationsProvider>
          </UsersProvider>
        </AuthProvider>
      </SystemProvider>
    </BrowserRouter>
  </StrictMode>,
)
