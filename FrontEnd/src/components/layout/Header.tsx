import { Bell, MoreVertical } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface HeaderProps {
  onDeleteClick?: () => void
}

export default function Header({ onDeleteClick }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // 경로에 따라 타이틀 바꾸기
  const getTitle = () => {
    if (location.pathname === '/home') return '담당 어르신 목록'
    if (location.pathname.startsWith('/register')) return '담당 어르신 등록'
    if (location.pathname.startsWith('/settings')) return '설정'
    if (location.pathname.includes('/edit')) return '어르신 정보 수정'
    if (location.pathname === '/camera') return '카메라 확인'
    if (location.pathname === '/notifications') return '알림'
    if (location.pathname.startsWith('/elders/') && !location.pathname.includes('/edit')) return '어르신 상세보기'
    return ''
  }

  const showBack = location.pathname.startsWith('/elders/') || location.pathname === '/camera' || location.pathname === '/notifications'
  const isDetail = showBack && !location.pathname.includes('/edit') && location.pathname !== '/camera' && location.pathname !== '/notifications'
  const showAlarm = location.pathname === '/home'

  // 뒤로가기 처리 함수
  const handleBack = () => {
    if (location.pathname.includes('/edit')) {
      // 수정 페이지에서는 상세보기로
      const detailPath = location.pathname.replace('/edit', '')
      navigate(detailPath)
    } else if (location.pathname.startsWith('/elders/')) {
      // 상세보기에서는 목록으로
      navigate('/home')
    } else if (location.pathname === '/camera') {
      // 카메라에서는 이전 페이지로 (어르신 상세보기에서 왔다면 상세보기로)
      const urlParams = new URLSearchParams(location.search)
      const fromId = urlParams.get('from')
      if (fromId) {
        navigate(`/elders/${fromId}`)
      } else {
        navigate('/home')
      }
    } else if (location.pathname === '/notifications') {
      // 알림에서는 홈으로
      navigate('/home')
    } else {
      // 기본적으로는 이전 페이지로
      navigate(-1)
    }
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 경로가 변경될 때 메뉴 상태 초기화
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // 메뉴 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <header className="relative flex h-28 flex-shrink-0 items-center justify-between px-4 bg-white" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', paddingTop: '35px' }}>
      <div className="flex items-center gap-2">
        {showBack && (
          <span
            onClick={handleBack}
            className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="w-4 h-4 rotate-45 border-l-3 border-b-3 border-zinc-700 inline-block" />
          </span>
        )}
        <h1 className="text-2xl font-semibold leading-none">{getTitle()}</h1>
      </div>
      {isDetail ? (
        <div className="relative" ref={menuRef}>
          <div 
            aria-label="메뉴" 
            onClick={() => setMenuOpen((v) => !v)} 
            className="w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <MoreVertical className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-28 rounded-lg border border-zinc-200 bg-white shadow-lg z-10">
              <button 
                onClick={() => {
                  const id = location.pathname.split('/')[2]
                  navigate(`/elders/${id}/edit`)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-50"
              >
                수정
              </button>
              <button 
                onClick={() => {
                  onDeleteClick?.()
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-zinc-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      ) : showAlarm ? (
        <div 
          aria-label="알림" 
          className="cursor-pointer"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-6 h-6 text-gray-600" strokeWidth={2.5} />
        </div>
      ) : null}

    </header>
  )
}
