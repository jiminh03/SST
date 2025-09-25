import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react'

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

interface InAppNotificationProps {
  notification: NotificationData | null
  onClose: () => void
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (notification) {
      setIsVisible(true)
      
      // 자동 닫기 (기본 5초)
      const timer = setTimeout(() => {
        handleClose()
      }, notification.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300) // 애니메이션 완료 후 제거
  }

  if (!notification) return null

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
      default:
        return <Bell className="w-6 h-6 text-gray-600" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`absolute top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`rounded-lg border shadow-lg p-4 ${getBgColor()}`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">
              {notification.title}
            </h3>
            <p className="text-gray-700 text-sm mt-1">
              {notification.message}
            </p>
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
