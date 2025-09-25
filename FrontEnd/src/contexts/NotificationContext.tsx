import React, { createContext, useContext, useState, type ReactNode } from 'react'

interface NotificationData {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  duration?: number
  actions?: {
    label: string
    onClick: () => void
  }[]
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void
  showSuccess: (title: string, message: string) => void
  showWarning: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showInfo: (title: string, message: string) => void
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
  const [, setNotification] = useState<NotificationData | null>(null)

  const showNotification = (data: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString()
    setNotification({ ...data, id })
  }

  const showSuccess = (title: string, message: string) => {
    showNotification({ type: 'success', title, message })
  }

  const showWarning = (title: string, message: string) => {
    showNotification({ type: 'warning', title, message })
  }

  const showError = (title: string, message: string) => {
    showNotification({ type: 'error', title, message })
  }

  const showInfo = (title: string, message: string) => {
    showNotification({ type: 'info', title, message })
  }

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showSuccess,
      showWarning,
      showError,
      showInfo
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
