import { createBrowserRouter } from 'react-router-dom'
import MobileLayout from '../layouts/MobileLayout'
import HomePage from '../pages/home/HomePage'
import EldersPage from '../pages/elders/EldersPage'
import SettingsPage from '../pages/settings/SettingsPage'
import RegisterPage from '../pages/register/RegisterPage'
import ElderDetailPage from '../pages/elders/ElderDetailPage'

const router = createBrowserRouter([
  {
    element: <MobileLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/elders', element: <EldersPage /> },
      { path: '/elders/:id', element: <ElderDetailPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/register', element: <RegisterPage/> },
    ],
  },
])

export default router