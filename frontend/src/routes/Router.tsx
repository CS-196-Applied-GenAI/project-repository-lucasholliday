import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { IdleTimerProvider } from '../auth/IdleTimerProvider'
import { AppShell } from '../layout/AppShell'
import { DiscoverPage } from '../pages/DiscoverPage'
import { HomeFeedPage } from '../pages/HomeFeedPage'
import { LoginPage } from '../pages/LoginPage'
import { MyProfilePage } from '../pages/MyProfilePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PostReplyPage } from '../pages/PostReplyPage'
import { PostTweetPage } from '../pages/PostTweetPage'
import { RegisterPage } from '../pages/RegisterPage'
import { RepliesPage } from '../pages/RepliesPage'
import { UserProfilePage } from '../pages/UserProfilePage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/' element={<Navigate to='/home' replace />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <IdleTimerProvider>
              <AppShell />
            </IdleTimerProvider>
          }
        >
          <Route path='/home' element={<HomeFeedPage />} />
          <Route path='/discover' element={<DiscoverPage />} />
          <Route path='/compose' element={<PostTweetPage />} />
          <Route path='/tweet/:tweetId/reply' element={<PostReplyPage />} />
          <Route path='/tweet/:tweetId/replies' element={<RepliesPage />} />
          <Route path='/profile' element={<MyProfilePage />} />
          <Route path='/u/:username' element={<UserProfilePage />} />
        </Route>
      </Route>
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
