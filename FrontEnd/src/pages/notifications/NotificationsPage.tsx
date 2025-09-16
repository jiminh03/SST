import { useState } from 'react'
import { Bell, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react'

interface Notification {
  id: number
  type: 'danger' | 'warning' | 'info'
  title: string
  message: string
  time: string
  isRead: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'danger',
      title: '위험 상황 감지',
      message: '김할머니님의 안방에서 낙상 위험이 감지되었습니다.',
      time: '5분 전',
      isRead: false
    },
    {
      id: 2,
      type: 'danger',
      title: '위험 상황 감지',
      message: '김할머니님의 화장실에서 응급상황이 감지되었습니다.',
      time: '1시간 전',
      isRead: true
    },
    {
      id: 3,
      type: 'danger',
      title: '위험 상황 감지',
      message: '김할머니님의 거실에서 낙상 위험이 감지되었습니다.',
      time: '3시간 전',
      isRead: true
    }
  ])

  const getNotificationIcon = () => {
    return <AlertTriangle className="w-5 h-5 text-red-600" />
  }

  const getNotificationBg = () => {
    return 'bg-red-50 border-red-200'
  }

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* 알림 목록 */}
      <div className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">위험 상황 알림이 없습니다</h3>
            <p className="text-sm text-gray-400">위험 상황이 감지되면 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getNotificationBg()} ${
                  !notification.isRead ? 'shadow-sm' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${
                      !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{notification.time}</span>
                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            읽음 처리
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
