import { createBrowserRouter } from 'react-router-dom'
import MobileLayout from '../layouts/MobileLayout'
import HomePage from '../pages/home/HomePage'
import EldersPage from '../pages/elders/EldersPage'
import SettingsPage from '../pages/settings/SettingsPage'
import RegisterPage from '../pages/register/RegisterPage'
import ElderDetailPage from '../pages/elders/ElderDetailPage'
import ElderEditPage from '../pages/elders/ElderEditPage'
import CameraPage from '../pages/camera/CameraPage'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import SplashPage from '../pages/splash/SplashPage'
import LoginPage from '../pages/auth/LoginPage'
import AuthRegisterPage from '../pages/auth/RegisterPage'

const router = createBrowserRouter([
  // 스플래시 화면 (레이아웃 없음)
  { path: '/', element: <SplashPage /> },
  
  // 로그인 페이지 (레이아웃 없음)
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/login', element: <LoginPage /> },
  
  // 회원가입 페이지 (레이아웃 없음)
  { path: '/auth/register', element: <AuthRegisterPage /> },
  { path: '/staffs', element: <AuthRegisterPage /> },
  
  // 메인 앱 페이지들 (MobileLayout 사용)
  {
    element: <MobileLayout />,
    children: [
      { path: '/home', element: <HomePage /> },
      { path: '/elders', element: <EldersPage /> },
      { path: '/elders/:id', element: <ElderDetailPage /> },
      { path: '/elders/:id/edit', element: <ElderEditPage /> },
      { path: '/camera', element: <CameraPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/register', element: <RegisterPage/> },
    ],
  },
])

export default router