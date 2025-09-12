import Header from '../components/layout/Header'
import { Outlet } from 'react-router-dom'
import TabBar from '../components/layout/TabBar'

export default function MobileLayout() {
  return (
    <div className="h-[800px] bg-gray-100 flex justify-center items-start overflow-hidden">
      <div className="w-[360px] h-[800px] flex-none bg-gray-50 flex flex-col shadow-lg">
        {/* 상단 고정 Header */}
        <Header />

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* 하단 TabBar */}
        <TabBar />
      </div>
    </div>
  )
}
