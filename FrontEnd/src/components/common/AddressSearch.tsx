import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

interface AddressSearchProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
}

export default function AddressSearch({ value, onChange, placeholder = "주소를 검색해주세요" }: AddressSearchProps) {
  const [selectedAddress, setSelectedAddress] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // value prop이 변경될 때 기존 주소를 파싱하여 표시
  useEffect(() => {
    if (value && !selectedAddress) {
      // 기존 주소에서 기본 주소와 상세주소 분리
      // 일반적으로 "시/도 시/군/구 도로명" + "상세주소" 형태
      const addressParts = value.split(' ')
      let baseAddress = ''
      let detailAddr = ''
      
      // 주소 패턴 분석 (간단한 휴리스틱)
      if (addressParts.length > 3) {
        // 앞의 3-4개 부분을 기본 주소로, 나머지를 상세주소로
        const splitIndex = Math.min(4, addressParts.length - 1)
        baseAddress = addressParts.slice(0, splitIndex).join(' ')
        detailAddr = addressParts.slice(splitIndex).join(' ')
      } else {
        baseAddress = value
      }
      
      setSelectedAddress(baseAddress)
      setDetailAddress(detailAddr)
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

  const handleClick = () => {
    // 다음 우편번호 서비스 사용
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          setSelectedAddress(data.roadAddress)
          const fullAddress = data.roadAddress + (detailAddress ? ` ${detailAddress}` : '')
          onChange(fullAddress)
        }
      }).open()
    }
  }

  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const detail = e.target.value
    setDetailAddress(detail)
    const fullAddress = selectedAddress + (detail ? ` ${detail}` : '')
    onChange(fullAddress)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-blue-500"><MapPin className="w-5 h-5" /></span>
        주소
        <span className="text-red-500">*</span>
      </label>
      
      <input
        ref={inputRef}
        type="text"
        value={selectedAddress}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleClick}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm cursor-pointer"
        readOnly
      />

      {/* 상세주소 입력 필드 */}
      {selectedAddress && (
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
      )}
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
