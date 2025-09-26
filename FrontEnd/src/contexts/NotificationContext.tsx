import React, { createContext, useContext, useState, type ReactNode } from 'react'

interface NotificationData {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: number
  seniorId?: number // 어르신 ID 추가
  read: boolean // 읽음 상태 추가
  duration?: number
  actions?: {
    label: string
    onClick: () => void
  }[]
}

interface NotificationContextType {
  notifications: NotificationData[]
  showNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void
  showSuccess: (title: string, message: string, seniorId?: number) => void
  showWarning: (title: string, message: string, seniorId?: number) => void
  showError: (title: string, message: string, seniorId?: number) => void
  showInfo: (title: string, message: string, seniorId?: number) => void
  clearNotifications: () => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const addNotification = (data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    // 중복 체크: 같은 내용의 알림이 최근 5초 내에 있는지 확인
    const now = Date.now()
    const recentNotifications = notifications.filter(n => 
      n.title === data.title && 
      n.message === data.message && 
      n.seniorId === data.seniorId &&
      (now - n.timestamp) < 5000 // 5초 내
    )
    
    if (recentNotifications.length > 0) {
      console.log('중복 알림 방지:', data.title, data.message)
      return // 중복 알림이면 저장하지 않음
    }
    
    // 고유한 ID 생성 (타임스탬프 + 랜덤)
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    const notificationData = { ...data, id, timestamp, read: false }
    
    setNotifications(prev => [notificationData, ...prev])
    
    // 로컬 스토리지에 저장 (최대 50개)
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    savedNotifications.unshift(notificationData)
    localStorage.setItem('notifications', JSON.stringify(savedNotifications.slice(0, 50)))
  }

  const showNotification = (data: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    // showNotification은 addNotification과 동일한 로직 사용
    addNotification(data)
  }

  const showSuccess = (title: string, message: string, seniorId?: number) => {
    showNotification({ type: 'success', title, message, seniorId })
  }

  const showWarning = (title: string, message: string, seniorId?: number) => {
    showNotification({ type: 'warning', title, message, seniorId })
  }

  const showError = (title: string, message: string, seniorId?: number) => {
    showNotification({ type: 'error', title, message, seniorId })
  }

  const showInfo = (title: string, message: string, seniorId?: number) => {
    showNotification({ type: 'info', title, message, seniorId })
  }

  const clearNotifications = () => {
    setNotifications([])
    localStorage.removeItem('notifications')
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
    
    // 로컬 스토리지 업데이트
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedNotifications = savedNotifications.map((notification: NotificationData) => 
      notification.id === id ? { ...notification, read: true } : notification
    )
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    
    // 로컬 스토리지 업데이트
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedNotifications = savedNotifications.map((notification: NotificationData) => 
      ({ ...notification, read: true })
    )
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // 컴포넌트 마운트 시 로컬 스토리지에서 로드
  React.useEffect(() => {
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
    setNotifications(savedNotifications)
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      addNotification,
      showSuccess,
      showWarning,
      showError,
      showInfo,
      clearNotifications,
      markAsRead,
      markAllAsRead,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  )
}