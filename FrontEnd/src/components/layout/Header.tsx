import { Bell, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()

  // 경로에 따라 타이틀 바꾸기
  const getTitle = () => {
    if (location.pathname === '/home') return '담당 어르신 목록'
    if (location.pathname.startsWith('/register')) return '담당 어르신 등록'
    if (location.pathname.startsWith('/settings')) return '설정'
    return ''
  }

  const showBack = location.pathname.startsWith('/elders/')
  const isDetail = showBack
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="relative flex h-20 flex-shrink-0 items-center justify-between px-4 bg-white shadow">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <span className="w-3 h-3 -rotate-45 border-l-2 border-b-2 border-zinc-700 inline-block" />
          </button>
        )}
        <h1 className="text-2xl font-semibold leading-none">{getTitle()}</h1>
      </div>
      {isDetail ? (
        <div className="relative">
          <button aria-label="메뉴" onClick={() => setMenuOpen((v) => !v)} className="w-10 h-10 flex items-center justify-center">
            <MoreVertical className="w-6 h-6 text-gray-600" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-28 rounded-lg border border-zinc-200 bg-white shadow-lg z-10">
              <button className="w-full text-left px-3 py-2 hover:bg-zinc-50">수정</button>
              <button className="w-full text-left px-3 py-2 text-red-600 hover:bg-zinc-50">삭제</button>
            </div>
          )}
        </div>
      ) : (
        <button aria-label="알림">
          <Bell className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </header>
  )
}
