import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { getNotifications, markNotificationAsRead, deleteNotification as deleteNotificationApi, type Notification } from '../../api/eldersApi'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 알림 목록 로드
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const data = await getNotifications()
        setNotifications(data)
      } catch (err) {
        setError('알림을 불러오는데 실패했습니다.')
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const getNotificationIcon = () => {
    return <AlertTriangle className="w-5 h-5 text-red-600" />
  }

  const getNotificationBg = () => {
    return 'bg-red-50 border-red-200'
  }

  const markAsRead = async (id: number) => {
    try {
      // 백엔드에 읽음 처리 요청
      await markNotificationAsRead(id)
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (err) {
      console.error('읽음 처리 실패:', err)
      // 에러가 발생해도 로컬 상태는 업데이트 (사용자 경험 개선)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      // 백엔드에 삭제 요청
      await deleteNotificationApi(id)
      
      // 로컬 상태에서 제거
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (err) {
      console.error('삭제 실패:', err)
      // 에러가 발생해도 로컬 상태는 업데이트 (사용자 경험 개선)
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // 알림을 읽음 처리
    markAsRead(notification.id)
    // 카메라 스트리밍 페이지로 이동 (스트리밍 모드)
    navigate(`/camera?streaming=true&seniorId=${notification.seniorId}&seniorName=${notification.seniorName}`)
  }

  // const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">알림을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

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
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-lg border ${getNotificationBg()} ${
                  !notification.isRead ? 'shadow-sm' : ''
                } cursor-pointer hover:shadow-md transition-all duration-200`}
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
                            onClick={(e) => {
                              e.stopPropagation() // 이벤트 전파 중단
                              markAsRead(notification.id)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            읽음 처리
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // 이벤트 전파 중단
                            deleteNotification(notification.id)
                          }}
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
