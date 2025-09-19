// 어르신 관련 API 타입 정의
export interface Senior {
  senior_id: number
  profile_img?: string  // 이미지 URL
  full_name: string
  address: string
  birth_date: string
  health_info?: string
  guardian_contact?: string
  device_id?: string
  created_at?: string
}

// 로그인 관련 API 타입 정의
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export interface LoginError {
  errorCode: string
  message: string
}

// 회원가입 관련 API 타입 정의
export interface RegisterRequest {
  full_name: string
  email: string
  password: string
}

export interface RegisterError {
  errorCode: string
  message: string
  [key: string]: any // 인덱스 시그니처 추가
}

// 개발 모드 설정 (목업 사용 여부)
const USE_MOCK_RESPONSES = false // FormData 방식으로 서버 문제 해결 시도

// 날짜 형식 자동 감지 함수
const tryCreateSeniorWithDifferentDateFormats = async (seniorData: CreateSeniorRequest, token: string): Promise<CreateSeniorResponse> => {
  const date = new Date(seniorData.birth_date)
  const dateFormats = [
    seniorData.birth_date, // 원본: 2025-05-14
    date.toISOString().split('T')[0], // ISO 형식
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`, // DD/MM/YYYY
    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`, // MM/DD/YYYY
    `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`, // YYYY.MM.DD
    date.toISOString(), // 전체 ISO 형식
  ]

  console.log('🔍 날짜 형식 자동 감지 시작:', dateFormats)

  for (let i = 0; i < dateFormats.length; i++) {
    const format = dateFormats[i]
    console.log(`📅 형식 ${i + 1} 시도: ${format}`)
    
    try {
      const modifiedData = { ...seniorData, birth_date: format }
      const result = await createSeniorWithFormat(modifiedData, token)
      console.log(`✅ 성공! 올바른 날짜 형식: ${format}`)
      return result
    } catch (error: any) {
      console.log(`❌ 형식 ${i + 1} 실패: ${format}`, error.message)
      if (i === dateFormats.length - 1) {
        throw error // 마지막 형식도 실패하면 에러 던지기
      }
    }
  }
  
  throw new Error('모든 날짜 형식이 실패했습니다')
}

// 특정 형식으로 어르신 등록 시도
const createSeniorWithFormat = async (seniorData: CreateSeniorRequest, token: string): Promise<CreateSeniorResponse> => {
  const possibleUrls = [
    'https://j13a503.p.ssafy.io/api/seniors',
    'http://127.0.0.1:7000/seniors'
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`📡 서버 연결 시도: ${url}`)
      
      const requestData: any = {
        full_name: seniorData.full_name,
        address: seniorData.address,
        birth_date: seniorData.birth_date,
        device_id: seniorData.device_id
      }
      
      if (seniorData.guardian_contact) {
        requestData.guardian_contact = seniorData.guardian_contact
      }
      
      if (seniorData.health_info) {
        requestData.health_info = Array.isArray(seniorData.health_info) 
          ? seniorData.health_info 
          : [seniorData.health_info]
      }

      console.log('📤 전송할 데이터:', requestData)
      console.log('📤 JSON 문자열:', JSON.stringify(requestData))

      // FormData 방식으로 변경 (서버 JSON 파싱 문제 해결)
      const formData = new FormData()
      formData.append('full_name', requestData.full_name)
      formData.append('address', requestData.address)
      formData.append('birth_date', requestData.birth_date)
      formData.append('device_id', requestData.device_id)
      
      if (requestData.guardian_contact) {
        formData.append('guardian_contact', requestData.guardian_contact)
      }
      
      if (requestData.health_info) {
        formData.append('health_info', JSON.stringify(requestData.health_info))
      }
      
      // 프로필 이미지 추가
      if (seniorData.profile_img) {
        formData.append('profile_img', seniorData.profile_img)
        console.log('📤 프로필 이미지 추가:', seniorData.profile_img.name, seniorData.profile_img.size, 'bytes')
      }

      console.log('📤 FormData 전송:', Object.fromEntries(formData.entries()))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type을 명시하지 않음 (FormData는 자동으로 multipart/form-data 설정)
        },
        body: formData,
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ 어르신 등록 성공 (${url}):`, result)
        return result
      } else {
        const errorText = await response.text()
        console.log(`❌ 서버 에러 (${url}):`, response.status, errorText)
        throw new Error(`서버 에러 (${response.status}): ${errorText}`)
      }
    } catch (error: any) {
      console.log(`❌ 연결 실패 (${url}):`, error.message)
      if (url === possibleUrls[possibleUrls.length - 1]) {
        throw error
      }
    }
  }
  
  throw new Error('모든 서버 연결 실패')
}

// 로그인 API
export const login = async (loginData: LoginRequest): Promise<LoginResponse> => {
  // 프로덕션 서버 사용
  const possibleUrls = [
    'https://j13a503.p.ssafy.io/api/auth/login'  // 프로덕션 서버
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`로그인 시도 중: ${url}`)
      console.log('요청 데이터:', loginData)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        // 타임아웃 설정 (5초)
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        if (response.status === 401) {
          const errorData: LoginError = await response.json()
          throw new Error(errorData.message || '로그인 실패')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: LoginResponse = await response.json()
      console.log(`로그인 성공! 서버 주소: ${url}`)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.log(`${url} 로그인 실패:`, errorMessage)
      
      // 모든 에러를 즉시 throw (서버가 하나뿐이므로)
      throw error
    }
  }

  // 실제 서버 연결 실패 시 처리
  if (USE_MOCK_RESPONSES) {
    console.log('모든 서버 연결 실패, 목업 응답 사용')
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('목업 로그인 성공:', loginData)
        resolve({
          access_token: 'mock_access_token_' + Date.now()
        })
      }, 1000)
    })
  } else {
    throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
  }
}

// 회원가입 API
export const register = async (registerData: RegisterRequest): Promise<void> => {
  // 프로덕션 서버 사용
  const possibleUrls = [
    'https://j13a503.p.ssafy.io/api/staffs'  // 프로덕션 서버
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`회원가입 시도 중: ${url}`)
      console.log('요청 데이터 상세:', {
        full_name: registerData.full_name,
        email: registerData.email,
        password: registerData.password ? '[비밀번호 숨김]' : '[비밀번호 없음]',
        passwordLength: registerData.password?.length || 0
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
        // 타임아웃 설정 (5초)
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        console.log(`HTTP 에러 발생: ${response.status} ${response.statusText}`)
        
        if (response.status === 400 || response.status === 409 || response.status === 422 || response.status === 500) {
          // 응답 본문을 한 번만 읽기 위해 clone() 사용
          const responseClone = response.clone()
          
          try {
            const errorData: RegisterError = await response.json()
            console.log('서버 에러 응답 상세:', {
              status: response.status,
              statusText: response.statusText,
              errorCode: errorData.errorCode,
              message: errorData.message,
              fullResponse: errorData
            })
            
            // 서버 응답의 실제 구조 확인
            console.log('서버 응답 원본:', JSON.stringify(errorData, null, 2))
            console.log('서버 응답 키들:', Object.keys(errorData))
            
            // 더 구체적인 에러 메시지 생성
            let errorMessage = '회원가입 실패'
            
            // 다양한 가능한 에러 필드명 확인
            const possibleErrorFields = ['errorCode', 'error_code', 'code', 'error']
            const possibleMessageFields = ['message', 'msg', 'detail', 'details', 'error_message']
            
            let foundErrorCode = null
            let foundMessage = null
            
            // 에러 코드 찾기
            for (const field of possibleErrorFields) {
              if (errorData[field]) {
                foundErrorCode = errorData[field]
                break
              }
            }
            
            // 메시지 찾기
            for (const field of possibleMessageFields) {
              if (errorData[field]) {
                foundMessage = errorData[field]
                break
              }
            }
            
            if (foundErrorCode && foundMessage) {
              errorMessage = `[${foundErrorCode}] ${foundMessage}`
            } else if (foundMessage) {
              errorMessage = foundMessage
            } else if (foundErrorCode) {
              errorMessage = `에러 코드: ${foundErrorCode}`
            } else {
              // 서버 응답 전체를 문자열로 변환해서 보여주기
              errorMessage = `서버 에러: ${JSON.stringify(errorData)}`
            }
            
            // 500 에러에 대한 특별한 메시지 추가
            if (response.status === 500) {
              errorMessage = `서버 내부 오류 (500): ${errorMessage}`
            }
            
            throw new Error(errorMessage)
          } catch (parseError) {
            console.log('에러 응답 파싱 실패:', parseError)
            console.log('응답 상태:', response.status, response.statusText)
            console.log('응답 헤더:', Object.fromEntries(response.headers.entries()))
            
            // 응답 본문을 텍스트로 읽어보기 (clone된 응답 사용)
            try {
              const responseText = await responseClone.text()
              console.log('응답 본문 (텍스트):', responseText)
              console.log('응답 본문 길이:', responseText.length)
              console.log('응답 본문 타입:', typeof responseText)
              
              if (responseText && responseText.trim()) {
                // JSON 파싱 시도
                try {
                  const parsedText = JSON.parse(responseText)
                  console.log('텍스트 JSON 파싱 성공:', parsedText)
                  throw new Error(`서버 에러 (${response.status}): ${JSON.stringify(parsedText)}`)
                } catch (parseError) {
                  console.log('텍스트 JSON 파싱 실패:', parseError)
                  throw new Error(`서버 에러 (${response.status}): ${responseText}`)
                }
              } else {
                throw new Error(`서버 에러 (${response.status}): 응답 본문이 비어있습니다`)
              }
            } catch (textError: any) {
              console.log('응답 본문 읽기 실패:', textError)
              console.log('textError 타입:', typeof textError)
              console.log('textError 메시지:', textError.message)
              throw new Error(`서버 에러 (${response.status}): 응답을 읽을 수 없습니다 - ${textError.message}`)
            }
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log(`회원가입 성공! 서버 주소: ${url}`)
      return
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.log(`${url} 회원가입 실패:`, errorMessage)
      console.log('에러 타입:', error instanceof Error ? error.constructor.name : typeof error)
      console.log('에러 상세:', error)
      
      // 네트워크 에러인지 확인
      if (errorMessage === 'Failed to fetch') {
        throw new Error('네트워크 연결 실패: 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.')
      }
      
      // 모든 에러를 즉시 throw (서버가 하나뿐이므로)
      throw error
    }
  }

  // 실제 서버 연결 실패 시 처리
  if (USE_MOCK_RESPONSES) {
    console.log('모든 서버 연결 실패, 목업 응답 사용')
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('목업 회원가입 성공:', registerData)
        resolve()
      }, 1000)
    })
  } else {
    throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
  }
}

// 어르신 목록 조회 API
export const getSeniors = async (): Promise<Senior[]> => {
  // 목업 모드인 경우 즉시 목업 응답 반환
  if (USE_MOCK_RESPONSES) {
    console.log('목업 모드: 어르신 목록 조회')
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: Senior[] = [
          { senior_id: 1, full_name: '김OO', address: '싸파트 503호', birth_date: '1950-01-01', health_info: '위험' },
          { senior_id: 2, full_name: '이OO', address: '싸파트 504호', birth_date: '1955-02-15', health_info: '안전' },
          { senior_id: 3, full_name: '신OO', address: '싸파트 505호', birth_date: '1960-03-20', health_info: '주의' },
        ]
        resolve(mockData)
      }, 500)
    })
  }

  // 가능한 서버 주소들 (프로덕션 서버 우선)
  const possibleUrls = [
    'https://j13a503.p.ssafy.io/api/seniors',
    'https://j13a503.p.ssafy.io/seniors',
    'http://127.0.0.1:7000/seniors',
    'http://127.0.0.1:7000/api/seniors'
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`시도 중: ${url}`)
      // 로그인 토큰 가져오기
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`성공! 서버 주소: ${url}`, data)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.log(`${url} 연결 실패:`, errorMessage)
      continue
    }
  }

  console.log('모든 서버 연결 실패, 목업 데이터 사용')
  
  // 모든 서버 연결 실패 시 목업 데이터 사용
  const mockData: Senior[] = [
    { senior_id: 1, full_name: '김OO', address: '싸파트 503호', birth_date: '1950-01-01', health_info: '위험' },
    { senior_id: 2, full_name: '이OO', address: '싸파트 504호', birth_date: '1955-02-15', health_info: '안전' },
    { senior_id: 3, full_name: '신OO', address: '싸파트 505호', birth_date: '1960-03-20', health_info: '주의' },
  ]
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('목업 데이터 반환:', mockData)
      resolve(mockData)
    }, 500)
  })
}

// 어르신 상세 조회 API
export const getSeniorById = async (seniorId: number): Promise<Senior> => {
  // 가능한 서버 주소들 (프로덕션 서버 우선)
  const possibleUrls = [
    `https://j13a503.p.ssafy.io/api/seniors/${seniorId}`,
    `https://j13a503.p.ssafy.io/seniors/${seniorId}`,
    `http://127.0.0.1:7000/seniors/${seniorId}`,
    `http://127.0.0.1:7000/api/seniors/${seniorId}`
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`상세 조회 시도 중: ${url}`)
      
      // 로그인 토큰 가져오기
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`상세 조회 성공! 서버 주소: ${url}`, data)
      console.log('📋 서버 응답 필드들:', Object.keys(data))
      console.log('📋 device_id 필드:', data.device_id)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.log(`${url} 상세 조회 실패:`, errorMessage)
      continue
    }
  }

  console.log('모든 서버 상세 조회 실패, 목업 데이터 사용')
  
  // 모든 서버 연결 실패 시 목업 데이터 사용
  const mockData: Senior = {
    senior_id: seniorId,
    full_name: '김OO',
    address: '싸파트 503호',
    birth_date: '1950-01-01',
    health_info: '위험'
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('목업 상세 데이터 반환:', mockData)
      resolve(mockData)
    }, 500)
  })
}

// 어르신 등록 관련 API 타입 정의
export interface CreateSeniorRequest {
  full_name: string
  birth_date: string
  address: string
  guardian_contact?: string
  health_info?: string[] | string
  profile_img?: File
  device_id: string
}

export interface CreateSeniorResponse {
  senior_id: number
}

// 응답 처리 함수 (사용하지 않음 - 자동 감지 함수에서 직접 처리)
/*
const handleResponse = async (response: Response, url: string): Promise<CreateSeniorResponse> => {
  if (!response.ok) {
    console.log(`HTTP 에러 발생: ${response.status} ${response.statusText}`)
    
    if (response.status === 401) {
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
    }
    
    if (response.status === 400 || response.status === 409 || response.status === 422) {
      try {
        const errorData = await response.json()
        console.log('서버 에러 응답 상세:', errorData)
        
        // 422 에러의 경우 더 자세한 정보 제공
        if (response.status === 422) {
          console.log('422 에러 상세 정보:', errorData)
          if (errorData.detail && Array.isArray(errorData.detail)) {
            console.log('detail 배열:', errorData.detail)
            const errorMessages = errorData.detail.map((err: any) => {
              console.log('개별 에러:', err)
              return `${err.loc ? err.loc.join('.') : 'unknown'}: ${err.msg || err.message || err}`
            }).join(', ')
            throw new Error(`데이터 검증 실패: ${errorMessages}`)
          } else if (errorData.message) {
            throw new Error(`데이터 검증 실패: ${errorData.message}`)
          } else {
            throw new Error(`데이터 검증 실패: ${JSON.stringify(errorData)}`)
          }
        }
        
        throw new Error(errorData.message || '어르신 등록 실패')
      } catch (parseError) {
        console.log('에러 응답 파싱 실패:', parseError)
        throw new Error(`서버 에러 (${response.status}): 응답을 읽을 수 없습니다`)
      }
    }
    
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  console.log(`어르신 등록 성공! 서버 주소: ${url}`, data)
  return data
}
*/

// 어르신 등록 API (날짜 형식 자동 감지)
export const createSenior = async (seniorData: CreateSeniorRequest): Promise<CreateSeniorResponse> => {
  // 목업 모드인 경우 즉시 목업 응답 반환
  if (USE_MOCK_RESPONSES) {
    console.log('목업 모드: 어르신 등록 성공')
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('목업 어르신 등록 성공:', seniorData)
        resolve({
          senior_id: Date.now() // 임시 ID 생성
        })
      }, 500)
    })
  }

  // 로그인 토큰 가져오기
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  console.log('🚀 어르신 등록 시작 (날짜 형식 자동 감지):', seniorData)
  
  // 자동으로 여러 날짜 형식을 시도
  return await tryCreateSeniorWithDifferentDateFormats(seniorData, token)
}

// 어르신 정보 수정 - 캐시 무효화를 위한 임시 주석
export const updateSenior = async (seniorId: number, updateData: Partial<Senior>): Promise<void> => {
  // 로그인 토큰 가져오기
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const possibleUrls = [
    'https://j13a503.p.ssafy.io/api/seniors'      // 프로덕션 서버 우선
  ]

  console.log('🚀 어르신 수정 API 시작 - 프로덕션 서버만 사용')
  console.log('📋 수정할 데이터:', updateData)

  for (const url of possibleUrls) {
    try {
      console.log(`🔧 어르신 수정 시도 중: ${url}/${seniorId}`)
      
      // FormData로 전송 (multipart/form-data) - Swagger 스펙에 맞게
      const formData = new FormData()
      
      // 필수 필드들
      formData.append('full_name', updateData.full_name || '')
      formData.append('address', updateData.address || '')
      formData.append('birth_date', updateData.birth_date || '')
      
      // 선택 필드들 (Swagger에서 optional로 표시됨)
      if (updateData.guardian_contact && updateData.guardian_contact.trim() !== '') {
        formData.append('guardian_contact', updateData.guardian_contact)
      }
      
      if (updateData.health_info && updateData.health_info.trim() !== '') {
        formData.append('health_info', updateData.health_info)
      }
      
      // 프로필 이미지 (Swagger에서 optional로 표시됨)
      if (updateData.profile_img) {
        formData.append('profile_img', updateData.profile_img)
      }
      
      // 전송할 데이터 로그
      console.log('📤 FormData 내용:', Object.fromEntries(formData.entries()))
      console.log('📤 health_info 값:', updateData.health_info)
      
      // 먼저 PUT 메서드로 시도
      let response = await fetch(`${url}/${seniorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type은 FormData 사용 시 자동 설정됨
        },
        body: formData,
      })

      // PUT이 실패하면 PATCH로 시도
      if (!response.ok && response.status === 404) {
        console.log(`PUT 실패, PATCH로 재시도: ${url}/${seniorId}`)
        response = await fetch(`${url}/${seniorId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })
      }

      if (response.ok) {
        console.log(`✅ 어르신 수정 성공! 서버 주소: ${url}/${seniorId}`)
        return
      } else {
        const errorText = await response.text()
        console.log(`❌ ${url}/${seniorId} 실패: ${response.status}`, errorText)
        
        // 400, 403 에러는 구체적인 메시지와 함께 던지기
        if (response.status === 400) {
          throw new Error(`잘못된 요청 형식: ${errorText}`)
        } else if (response.status === 403) {
          throw new Error(`권한 없음: ${errorText}`)
        } else if (response.status === 500) {
          throw new Error(`서버 내부 오류: ${errorText}`)
        }
      }
    } catch (error) {
      console.log(`${url}/${seniorId} 연결 실패:`, error)
    }
  }

  throw new Error('모든 서버 연결 실패')
}

// 알림 관련 API 타입 정의
export interface Notification {
  id: number
  type: 'danger' | 'warning' | 'info'
  title: string
  message: string
  time: string
  isRead: boolean
  seniorId: number
  seniorName: string
}

// 알림 목록 조회 API
export const getNotifications = async (): Promise<Notification[]> => {
  const possibleUrls = [
    'http://127.0.0.1:7000/notifications',
    'https://j13a503.p.ssafy.io/api/notifications'
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`알림 목록 조회 시도: ${url}`)
      
      const token = localStorage.getItem('access_token')
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`알림 목록 조회 성공 (${url}):`, data)
        return data
      } else {
        console.log(`알림 목록 조회 실패 (${url}):`, response.status)
      }
    } catch (error: any) {
      console.log(`알림 목록 조회 연결 실패 (${url}):`, error.message)
      if (url === possibleUrls[possibleUrls.length - 1]) {
        throw error
      }
    }
  }
  
  // 모든 서버 연결 실패 시 목업 데이터 반환
  console.log('모든 서버 연결 실패, 목업 알림 데이터 사용')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          type: 'danger',
          title: '위험 상황 감지',
          message: '김할머니님의 안방에서 낙상 위험이 감지되었습니다.',
          time: '5분 전',
          isRead: false,
          seniorId: 1,
          seniorName: '김할머니'
        },
        {
          id: 2,
          type: 'danger',
          title: '위험 상황 감지',
          message: '김할머니님의 화장실에서 응급상황이 감지되었습니다.',
          time: '1시간 전',
          isRead: true,
          seniorId: 1,
          seniorName: '김할머니'
        }
      ])
    }, 500)
  })
}

// 알림 읽음 처리 API
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  const possibleUrls = [
    `http://127.0.0.1:7000/notifications/${notificationId}/read`,
    `https://j13a503.p.ssafy.io/api/notifications/${notificationId}/read`
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`알림 읽음 처리 시도: ${url}`)
      
      const token = localStorage.getItem('access_token')
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        console.log(`알림 읽음 처리 성공 (${url})`)
        return
      } else {
        console.log(`알림 읽음 처리 실패 (${url}):`, response.status)
      }
    } catch (error: any) {
      console.log(`알림 읽음 처리 연결 실패 (${url}):`, error.message)
      if (url === possibleUrls[possibleUrls.length - 1]) {
        throw error
      }
    }
  }
  
  // 모든 서버 연결 실패 시 목업 응답
  console.log('모든 서버 연결 실패, 목업 읽음 처리 성공')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 300)
  })
}

// 알림 삭제 API
export const deleteNotification = async (notificationId: number): Promise<void> => {
  const possibleUrls = [
    `http://127.0.0.1:7000/notifications/${notificationId}`,
    `https://j13a503.p.ssafy.io/api/notifications/${notificationId}`
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`알림 삭제 시도: ${url}`)
      
      const token = localStorage.getItem('access_token')
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        console.log(`알림 삭제 성공 (${url})`)
        return
      } else {
        console.log(`알림 삭제 실패 (${url}):`, response.status)
      }
    } catch (error: any) {
      console.log(`알림 삭제 연결 실패 (${url}):`, error.message)
      if (url === possibleUrls[possibleUrls.length - 1]) {
        throw error
      }
    }
  }
  
  // 모든 서버 연결 실패 시 목업 응답
  console.log('모든 서버 연결 실패, 목업 삭제 성공')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 300)
  })
}

// 어르신 삭제
export const deleteSenior = async (seniorId: number): Promise<void> => {
  const possibleUrls = [
    `http://j13a503.p.ssafy.io:8000/seniors/${seniorId}`,
    `http://j13a503.p.ssafy.io:8000/api/v1/seniors/${seniorId}`,
    `http://127.0.0.1:8000/seniors/${seniorId}`,
    `http://127.0.0.1:8000/api/v1/seniors/${seniorId}`,
    `http://localhost:3000/seniors/${seniorId}`,
    `http://localhost:3001/seniors/${seniorId}`,
    `http://localhost:8080/seniors/${seniorId}`,
    `http://127.0.0.1:3000/seniors/${seniorId}`,
    `http://127.0.0.1:3001/seniors/${seniorId}`,
    `http://127.0.0.1:8080/seniors/${seniorId}`
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`어르신 삭제 시도 중: ${url}`)
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log(`성공! 서버 주소: ${url}`)
        return
      } else {
        console.log(`${url} 실패: ${response.status}`)
      }
    } catch (error) {
      console.log(`${url} 연결 실패:`, error)
    }
  }

  // 모든 서버 연결 실패 시 더미 응답
  console.log('모든 서버 연결 실패, 더미 응답 반환')
  return Promise.resolve()
}
