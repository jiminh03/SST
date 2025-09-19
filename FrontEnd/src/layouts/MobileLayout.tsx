import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import { Outlet } from 'react-router-dom'
import TabBar from '../components/layout/TabBar'
import { deleteSenior } from '../api/eldersApi'
import { Eye, EyeOff } from 'lucide-react'

export default function MobileLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleRegisterSuccessConfirm = () => {
    setShowRegisterSuccess(false)
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    setPasswordError(null)
  }

  const handlePasswordSubmit = async () => {
    // 비밀번호 유효성 검사
    if (!passwordData.currentPassword.trim()) {
      setPasswordError('현재 비밀번호를 입력해주세요.')
      return
    }
    if (!passwordData.newPassword.trim()) {
      setPasswordError('새 비밀번호를 입력해주세요.')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('새 비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      // TODO: 비밀번호 변경 API 호출
      console.log('비밀번호 변경:', passwordData)
      alert('비밀번호가 변경되었습니다.')
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleLogoutConfirm = () => {
    localStorage.removeItem('access_token')
    setShowLogoutModal(false)
    navigate('/splash')
  }

  const handleWithdrawConfirm = () => {
    // TODO: 회원탈퇴 API 호출
    console.log('회원탈퇴')
    localStorage.removeItem('access_token')
    setShowWithdrawModal(false)
    alert('회원탈퇴가 완료되었습니다.')
    navigate('/splash')
  }

  const handleUpdateSuccessConfirm = () => {
    setShowUpdateSuccess(false)
    // URL에서 updated=true 파라미터 제거
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  // URL 파라미터로 등록 성공 상태 및 비밀번호 변경 모달 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('registered') === 'true') {
      setShowRegisterSuccess(true)
      // URL에서 파라미터 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
    if (urlParams.get('changePassword') === 'true') {
      setShowPasswordModal(true)
      // URL에서 파라미터 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
    if (urlParams.get('logout') === 'true') {
      setShowLogoutModal(true)
      // URL에서 파라미터 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
    if (urlParams.get('withdraw') === 'true') {
      setShowWithdrawModal(true)
      // URL에서 파라미터 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
    if (urlParams.get('updated') === 'true') {
      setShowUpdateSuccess(true)
    }
  }, [location.search])

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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px'
    }}>
      {/* 폰 목업 배경 */}
      <div style={{ position: 'relative' }}>
        {/* 폰 외곽선 */}
        <div style={{
          width: '400px',
          height: '840px',
          backgroundColor: '#000000',
          borderRadius: '48px',
          padding: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          {/* 폰 화면 */}
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '40px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* 노치 */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '128px',
              height: '24px',
              backgroundColor: '#000000',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              zIndex: 10
            }}></div>
            
                   {/* 실제 앱 컨텐츠 */}
                   <div style={{
                     width: '100%',
                     height: '100%',
                     backgroundColor: '#f9fafb',
                     display: 'flex',
                     flexDirection: 'column',
                     position: 'relative',
                     paddingTop: '0px',
                     background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 40px, #f9fafb 100%)'
                   }}>
              {/* 상단 고정 Header */}
              <Header onDeleteClick={handleDeleteClick} />

              {/* 메인 컨텐츠 */}
              <main style={{
                flex: 1,
                overflowY: 'auto'
              }}>
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

              {/* 등록 성공 모달 - 웹 앱 레이아웃 안에서만 */}
              {showRegisterSuccess && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl">
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-gray-800 mb-4">담당 어르신 등록</h2>
                      <p className="text-gray-600 mb-8">등록되었습니다.</p>
                      <button
                        onClick={handleRegisterSuccessConfirm}
                        className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors"
                        style={{ backgroundColor: '#0088FF' }}
                      >
                        확인
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 비밀번호 변경 모달 - 웹 앱 레이아웃 안에서만 */}
              {showPasswordModal && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">비밀번호 변경</h3>
                    
                    <div className="space-y-4">
                      {/* 현재 비밀번호 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">현재 비밀번호</label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                            className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="현재 비밀번호를 입력하세요"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* 새 비밀번호 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">새 비밀번호</label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="새 비밀번호를 입력하세요"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* 비밀번호 확인 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">비밀번호 확인</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="새 비밀번호를 다시 입력하세요"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* 에러 메시지 */}
                      {passwordError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">{passwordError}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowPasswordModal(false)
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                          setPasswordError(null)
                        }}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handlePasswordSubmit}
                        className="flex-1 py-3 px-4 text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#0088FF' }}
                      >
                        변경
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 로그아웃 확인 모달 - 웹 앱 레이아웃 안에서만 */}
              {showLogoutModal && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">로그아웃</h3>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                      로그아웃 하시겠습니까?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleLogoutConfirm}
                        className="flex-1 py-3 px-4 text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#0088FF' }}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </div>
              )}

                     {/* 회원탈퇴 확인 모달 - 웹 앱 레이아웃 안에서만 */}
                     {showWithdrawModal && (
                       <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                         <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
                           <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">회원탈퇴</h3>
                           <p className="text-sm text-gray-600 mb-6 text-center">
                             정말 회원탈퇴 하시겠습니까?<br />
                             탈퇴 후에는 복구할 수 없습니다.
                           </p>
                           <div className="flex gap-3">
                             <button
                               onClick={() => setShowWithdrawModal(false)}
                               className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                             >
                               취소
                             </button>
                             <button
                               onClick={handleWithdrawConfirm}
                               className="flex-1 py-3 px-4 text-white rounded-lg transition-colors"
                               style={{ backgroundColor: '#FF4444' }}
                             >
                               탈퇴
                             </button>
                           </div>
                         </div>
                       </div>
                     )}

                     {/* 수정 완료 모달 - 웹 앱 레이아웃 안에서만 */}
                     {showUpdateSuccess && (
                       <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                         <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl">
                           <div className="text-center">
                             <h2 className="text-xl font-bold text-gray-800 mb-4">어르신 정보 수정</h2>
                             <p className="text-gray-600 mb-8">수정되었습니다.</p>
                             <button
                               onClick={handleUpdateSuccessConfirm}
                               className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-colors"
                               style={{ backgroundColor: '#0088FF' }}
                             >
                               확인
                             </button>
                           </div>
                         </div>
                       </div>
                     )}
            </div>
        </div>
      </div>
    </div>
  </div>
  )
}