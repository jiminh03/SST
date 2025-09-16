import { NavLink, useLocation } from 'react-router-dom'
import SettingsIcon from '../../assets/icons/SettingsIcon'
import RegisterIcon from '../../assets/icons/RegisterIcon'

export default function TabBar() {
  const location = useLocation()
  const isHomeActive = location.pathname === '/home' || location.pathname.startsWith('/elders') || location.pathname === '/notifications' || location.pathname === '/camera'

  return (
    <nav className="sticky bottom-0 z-10 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
      <div className="relative grid grid-cols-3 items-center h-16 sm:h-20">
        {/* 어르신 등록 */}
        <NavLink
          to="/register"
          className="flex flex-col items-center no-underline"
          style={{
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
            color: location.pathname.startsWith('/register')
              ? '#0088FF'
              : '#AFAFAF',
          }}
        >
          <RegisterIcon
            size={32}
            color={
              location.pathname.startsWith('/register')
                ? '#0088FF'
                : '#AFAFAF'
            }
          />
          <span>어르신 등록</span>
        </NavLink>

        {/* 홈 버튼 */}
        <div className="flex justify-center relative">
          <NavLink
            to="/home"
            className="-translate-y-4 sm:-translate-y-6 no-underline relative"
            style={{ textDecoration: 'none' }}
          >
            {/* 흰색 반원 배경 */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-[90px] h-[45px] rounded-t-full bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.12)] z-0" />

            {/* 실제 원 */}
            <div
              className="relative z-10 flex items-center justify-center rounded-full overflow-hidden shadow-lg"
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: isHomeActive ? '#0088FF' : '#AFAFAF',
              }}
            >
              <img
                src="/icons/home.png"
                alt="홈"
                className="object-contain max-w-[100%] max-h-[100%]"
              />
            </div>
          </NavLink>
        </div>

        {/* 설정 */}
        <NavLink
          to="/settings"
          className="flex flex-col items-center no-underline"
          style={{
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
            color: location.pathname.startsWith('/settings')
              ? '#0088FF'
              : '#AFAFAF',
          }}
        >
          <SettingsIcon
            size={32}
            color={
              location.pathname.startsWith('/settings')
                ? '#0088FF'
                : '#AFAFAF'
            }
          />
          <span>설정</span>
        </NavLink>
      </div>
    </nav>
  )
}
