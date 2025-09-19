import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeniorById, updateSenior } from '../../api/eldersApi'
import type { Senior } from '../../api/eldersApi'
import { User, MapPin, Smartphone, Calendar, Camera, Phone } from 'lucide-react'
import AddressSearch from '../../components/common/AddressSearch'

export default function ElderEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [senior, setSenior] = useState<Senior | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    birth_date: '',
    device_id: '',
    guardian_contact: '',
    notes: ''
  })

  useEffect(() => {
    const fetchSenior = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await getSeniorById(parseInt(id))
        console.log('🔍 어르신 상세 데이터:', data)
        setSenior(data)
        // health_info를 문자열로 변환하는 함수
        const parseHealthInfo = (healthInfo: any): string => {
          if (!healthInfo) return ''
          
          // 배열인 경우 처리
          if (Array.isArray(healthInfo)) {
            return healthInfo.join(', ')
          }
          
          // 문자열인 경우 JSON 파싱 시도
          if (typeof healthInfo === 'string') {
            if (healthInfo.startsWith('[') && healthInfo.endsWith(']')) {
              try {
                const parsed = JSON.parse(healthInfo)
                if (Array.isArray(parsed)) {
                  return parsed.join(', ')
                }
              } catch (e) {
                // 파싱 실패 시 원본 문자열 사용
              }
            }
            return healthInfo
          }
          
          return String(healthInfo)
        }

        setFormData({
          full_name: data.full_name || '',
          address: data.address || '',
          birth_date: data.birth_date || '',
          device_id: data.device_id || '',
          guardian_contact: data.guardian_contact || '',
          notes: parseHealthInfo(data.health_info)  // health_info를 파싱하여 특이사항으로 설정
        })
        
        // 현재 프로필 이미지 로드
        loadCurrentProfileImage(data.senior_id)
      } catch (err) {
        setError('어르신 정보를 불러오는데 실패했습니다.')
        console.error('Error fetching senior:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSenior()
  }, [id])

  // 컴포넌트 언마운트 시 메모리 정리
  useEffect(() => {
    return () => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }
    }
  }, [currentImageUrl])

  // 현재 프로필 이미지 로드 함수
  const loadCurrentProfileImage = (seniorId: number) => {
    console.log('🖼️ 편집페이지 현재 이미지 로드 시작 - senior_id:', seniorId)
    setImageLoading(true)
    const token = localStorage.getItem('access_token')
    
    // 프록시를 통한 이미지 API 호출
    const imageApiUrl = `/api/seniors/${seniorId}/profile-image`
    console.log('🖼️ 편집페이지 이미지 API URL:', imageApiUrl)
    
    fetch(imageApiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('🖼️ 편집페이지 이미지 응답 상태:', response.status, response.statusText)
      if (response.ok) {
        return response.blob()
      }
      throw new Error(`Image load failed: ${response.status}`)
    })
    .then(blob => {
      console.log('🖼️ 편집페이지 이미지 blob 크기:', blob.size)
      const url = URL.createObjectURL(blob)
      setCurrentImageUrl(url)
      setImageLoading(false)
      console.log('🖼️ 편집페이지 현재 이미지 로드 성공!')
    })
    .catch(error => {
      console.log('❌ 편집페이지 현재 이미지 로드 실패:', error)
      setCurrentImageUrl(null)
      setImageLoading(false)
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      
      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
        // 새 이미지 선택 시 현재 이미지 URL 초기화
        if (currentImageUrl) {
          URL.revokeObjectURL(currentImageUrl)
          setCurrentImageUrl(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdate = async () => {
    if (!senior) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      await updateSenior(senior.senior_id, {
        full_name: formData.full_name,
        address: formData.address,
        birth_date: formData.birth_date,
        guardian_contact: formData.guardian_contact,
        health_info: formData.notes
      })
      
      window.location.href = `/elders/${senior.senior_id}?updated=true`
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '어르신 정보 수정에 실패했습니다.'
      
      if (errorMessage.includes('CORS')) {
        setError('서버에서 어르신 수정 기능의 CORS 설정이 누락되었습니다. 백엔드 팀에 문의하세요.')
      } else if (errorMessage.includes('500')) {
        setError('서버 내부 오류가 발생했습니다. 백엔드 팀에 문의하세요.')
      } else if (errorMessage.includes('400')) {
        setError('잘못된 요청 형식입니다. 필수 필드를 확인해주세요.')
      } else if (errorMessage.includes('403')) {
        setError('권한이 없습니다. 로그인을 다시 시도해주세요.')
      } else {
        setError('어르신 정보 수정에 실패했습니다. 다시 시도해주세요.')
      }
      
      console.error('Update error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">어르신 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error && !senior) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/home')} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {/* 프로필 사진 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden">
                {imageLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="새 프로필" 
                    className="w-full h-full object-cover"
                  />
                ) : currentImageUrl ? (
                  <img 
                    src={currentImageUrl} 
                    alt="현재 프로필" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-20 h-20 text-gray-400" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-2 text-white p-2 rounded-full shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
                style={{ backgroundColor: '#0088FF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0066CC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088FF'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 폼 섹션 */}
          <div className="space-y-6">
            <FormField 
              icon={<User className="w-5 h-5" />}
              label="이름" 
              required 
              placeholder="이름을 입력해주세요"
              value={formData.full_name}
              onChange={(value) => handleInputChange('full_name', value)}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-blue-500"><Calendar className="w-5 h-5" /></span>
                생년월일
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <AddressSearch 
              value={formData.address}
              onChange={(address) => handleInputChange('address', address)}
              placeholder="주소를 검색해주세요"
            />

            <FormField 
              icon={<Phone className="w-5 h-5" />}
              label="보호자 연락처" 
              placeholder="예) 010-1234-5678"
              value={formData.guardian_contact}
              onChange={(value) => handleInputChange('guardian_contact', value)}
            />
            
            {/* 특이사항 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-blue-500"><User className="w-5 h-5" /></span>
                특이사항
              </label>
              <div className="relative">
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm resize-none"
                  placeholder="특이사항을 입력해주세요"
                  rows={3}
                />
              </div>
            </div>

          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="fixed top-4 left-4 right-4 z-50 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* 버튼 */}
          <div className="mt-8 pb-20">
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0088FF' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  수정 중...
                </div>
              ) : (
                '정보 수정하기'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

interface FormFieldProps {
  icon: React.ReactNode
  label: string
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

function FormField({ icon, label, required, placeholder, value, onChange }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-blue-500">{icon}</span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
        />
      </div>
    </div>
  )
}
