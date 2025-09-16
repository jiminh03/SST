import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Outlet } from 'react-router-dom'
import TabBar from '../components/layout/TabBar'
import { deleteSenior } from '../api/eldersApi'

export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    const id = location.pathname.split('/')[2]
    if (!id) return
    
    try {
      setIsDeleting(true)
      await deleteSenior(parseInt(id))
      alert('어르신 정보가 삭제되었습니다.')
      navigate('/home')
    } catch (err) {
      alert('어르신 정보 삭제에 실패했습니다. 다시 시도해주세요.')
      console.error('Delete error:', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="h-[800px] bg-gray-100 flex justify-center items-start overflow-hidden">
      <div className="w-[360px] h-[800px] flex-none bg-gray-50 flex flex-col shadow-lg relative">
        {/* 상단 고정 Header */}
        <Header onDeleteClick={handleDeleteClick} />

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* 하단 TabBar */}
        <TabBar />

        {/* 삭제 확인 모달 - 웹 앱 레이아웃 안에서만 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">담당 어르신 정보</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">
                정말 삭제하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  아니오
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#0088FF' }}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
