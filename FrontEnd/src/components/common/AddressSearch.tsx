import { useState, useRef, useEffect } from 'react'
import { MapPin, Search, X } from 'lucide-react'

interface AddressSearchProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
}

interface AddressItem {
  roadAddress: string
  jibunAddress: string
  buildingName: string
}

export default function AddressSearch({ value, onChange, placeholder = "주소를 검색해주세요" }: AddressSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // value prop이 변경될 때 기존 주소를 파싱하여 표시
  useEffect(() => {
    if (value && !selectedAddress) {
      // 기존 주소가 있으면 selectedAddress로 설정
      setSelectedAddress(value)
    }
  }, [value, selectedAddress])

  // 다음 우편번호 서비스 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleSearch = () => {
    setIsLoading(true)
    
    // 다음 우편번호 서비스 사용
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          const addressData: AddressItem = {
            roadAddress: data.roadAddress,
            jibunAddress: data.jibunAddress,
            buildingName: data.buildingName
          }
          
          setAddresses([addressData])
          setIsLoading(false)
          setIsOpen(true)
        },
        onclose: function() {
          setIsLoading(false)
        }
      }).open()
    } else {
      // API가 로드되지 않은 경우 대체 검색
      setTimeout(() => {
        const mockAddresses: AddressItem[] = [
          {
            roadAddress: `${searchQuery || '서울'}로 123`,
            jibunAddress: `${searchQuery || '서울'} 456-789`,
            buildingName: '아파트'
          }
        ]
        setAddresses(mockAddresses)
        setIsLoading(false)
        setIsOpen(true)
      }, 1000)
    }
  }

  const handleSelectAddress = (address: AddressItem) => {
    setSelectedAddress(address.roadAddress)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const detail = e.target.value
    setDetailAddress(detail)
    const fullAddress = selectedAddress + (detail ? ` ${detail}` : '')
    onChange(fullAddress)
  }

  const handleClear = () => {
    onChange('')
    setSearchQuery('')
    setSelectedAddress('')
    setDetailAddress('')
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-blue-500"><MapPin className="w-5 h-5" /></span>
        주소
        <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedAddress || searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={selectedAddress ? selectedAddress : placeholder}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm cursor-pointer"
          onClick={handleSearch}
          readOnly
        />

        {/* 선택된 주소 표시 및 상세주소 입력 */}
        {selectedAddress && (
          <div className="mt-3 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">선택된 주소</p>
                    <p className="text-sm text-blue-700">{selectedAddress}</p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 상세주소 입력 필드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">상세주소</label>
              <input
                type="text"
                value={detailAddress}
                onChange={handleDetailAddressChange}
                placeholder="동/호수, 건물명 등을 입력해주세요"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm shadow-sm transition-all"
              />
            </div>
          </div>
        )}

        {/* 검색 결과 */}
        {isOpen && addresses.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {addresses.map((address, index) => (
              <div
                key={index}
                onClick={() => handleSelectAddress(address)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm text-gray-900">
                  {address.roadAddress}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {address.jibunAddress}
                </div>
                {address.buildingName && (
                  <div className="text-xs text-blue-600 mt-1">
                    {address.buildingName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// TypeScript 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: any) => any
    }
  }
}
