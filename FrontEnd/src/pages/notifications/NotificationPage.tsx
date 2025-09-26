import { Bell, Trash2, CheckCheck } from 'lucide-react'
import { useNotification } from '../../contexts/NotificationContext'
import { useNavigate } from 'react-router-dom'

export default function NotificationPage() {
  const { notifications, clearNotifications, markAsRead, markAllAsRead, unreadCount } = useNotification()
  const navigate = useNavigate()

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification: any) => {
    // 읽음 처리
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // 어르신 상세조회로 이동
    if (notification.seniorId) {
      navigate(`/elders/${notification.seniorId}`)
    }
  }

  // 시간 포맷팅
  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return '방금 전'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`
    
    return new Date(timestamp).toLocaleDateString('ko-KR')
  }

  // 알림 타입별 아이콘과 색상
  const getNotificationStyle = (type: string, message: string) => {
    // 위험 상태인 경우 빨간색으로 표시
    if (message.includes('위험')) {
      return { icon: '🚨', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' }
    }
    
    // 안전 상태인 경우 초록색으로 표시
    if (message.includes('안전')) {
      return { icon: '✅', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' }
    }
    
    switch (type) {
      case 'success':
        return { icon: '✅', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' }
      case 'warning':
        return { icon: '⚠️', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-800' }
      case 'error':
        return { icon: '❌', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' }
      case 'info':
        return { icon: 'ℹ️', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' }
      default:
        return { icon: '📢', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-800' }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 알림 목록 */}
      <div className="px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Bell className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">알림이 없습니다</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
              새로운 알림이 오면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 버튼 영역 */}
            <div className="flex justify-end gap-2 mb-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  전체 읽음
                </button>
              )}
              
              <button
                onClick={clearNotifications}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                전체 삭제
              </button>
            </div>

            {/* 알림 목록 */}
            <div className="space-y-3">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type, notification.message)
                
                return (
                  <div
                    key={notification.id}
                    className={`group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${
                      notification.seniorId ? 'cursor-pointer hover:scale-[1.01]' : ''
                    } ${notification.read ? 'opacity-60' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      {/* 아이콘 */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${style.bgColor}`}>
                        <span className="text-xl">{style.icon}</span>
                      </div>
                      
                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold text-base ${style.textColor}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {notification.seniorId && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-medium">
                                클릭하여 상세보기
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500 text-xs">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}