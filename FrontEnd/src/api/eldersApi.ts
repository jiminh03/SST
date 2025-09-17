// 어르신 관련 API 타입 정의
export interface Senior {
  senior_id: number
  name: string
  address: string
  health_info: string
}

// 로그인 관련 API 타입 정의
export interface LoginRequest {
  login_id: string
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
  login_id: string
  password: string
}

export interface RegisterError {
  errorCode: string
  message: string
}

// 개발 모드 설정 (목업 사용 여부)
const USE_MOCK_RESPONSES = false // true로 설정하면 서버 연결 실패 시 목업 응답 사용

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
      if (errorMessage.includes('로그인 실패') || errorMessage.includes('ID 또는 비밀번호')) {
        throw error // 로그인 실패는 즉시 에러로 처리
      }
      continue
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
      console.log('요청 데이터:', registerData)
      
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
        if (response.status === 400 || response.status === 409) {
          const errorData: RegisterError = await response.json()
          throw new Error(errorData.message || '회원가입 실패')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log(`회원가입 성공! 서버 주소: ${url}`)
      return
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.log(`${url} 회원가입 실패:`, errorMessage)
      if (errorMessage.includes('회원가입 실패') || errorMessage.includes('ID 중복') || errorMessage.includes('필수 필드')) {
        throw error // 회원가입 실패는 즉시 에러로 처리
      }
      continue
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
  // 가능한 서버 주소들
  const possibleUrls = [
    'http://j13a503.p.ssafy.io:8000/seniors',
    'http://j13a503.p.ssafy.io:8000/api/v1/seniors',
    'http://localhost:3000/seniors',
    'http://localhost:3001/seniors', 
    'http://localhost:8080/seniors',
    'http://127.0.0.1:3000/seniors',
    'http://127.0.0.1:3001/seniors',
    'http://127.0.0.1:8080/seniors',
    'http://127.0.0.1:8000/seniors',
    'http://127.0.0.1:8000/api/v1/seniors'
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`시도 중: ${url}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
    { senior_id: 1, name: '김OO', address: '싸파트 503호', health_info: '위험' },
    { senior_id: 2, name: '이OO', address: '싸파트 504호', health_info: '안전' },
    { senior_id: 3, name: '신OO', address: '싸파트 505호', health_info: '주의' },
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
  // 가능한 서버 주소들
  const possibleUrls = [
    `http://j13a503.p.ssafy.io:8000/seniors/${seniorId}`,
    `http://j13a503.p.ssafy.io:8000/api/v1/seniors/${seniorId}`,
    `http://localhost:3000/seniors/${seniorId}`,
    `http://localhost:3001/seniors/${seniorId}`, 
    `http://localhost:8080/seniors/${seniorId}`,
    `http://127.0.0.1:3000/seniors/${seniorId}`,
    `http://127.0.0.1:3001/seniors/${seniorId}`,
    `http://127.0.0.1:8080/seniors/${seniorId}`,
    `http://127.0.0.1:8000/seniors/${seniorId}`,
    `http://127.0.0.1:8000/api/v1/seniors/${seniorId}`
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`상세 조회 시도 중: ${url}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`상세 조회 성공! 서버 주소: ${url}`, data)
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
    name: '김OO',
    address: '싸파트 503호',
    health_info: '위험'
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('목업 상세 데이터 반환:', mockData)
      resolve(mockData)
    }, 500)
  })
}

// 어르신 등록 API
export const createSenior = async (seniorData: Omit<Senior, 'senior_id'>): Promise<Senior> => {
  // 가능한 서버 주소들
  const possibleUrls = [
    'http://j13a503.p.ssafy.io:8000/seniors',
    'http://j13a503.p.ssafy.io:8000/api/v1/seniors',
    'http://127.0.0.1:8000/seniors',
    'http://127.0.0.1:8000/api/v1/seniors',
    'http://localhost:3000/seniors',
    'http://localhost:3001/seniors', 
    'http://localhost:8080/seniors',
    'http://127.0.0.1:3000/seniors',
    'http://127.0.0.1:3001/seniors',
    'http://127.0.0.1:8080/seniors'
  ]

  for (const url of possibleUrls) {
    try {
      console.log(`등록 시도 중: ${url}`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seniorData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`등록 성공! 서버 주소: ${url}`, data)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.log(`${url} 등록 실패:`, errorMessage)
      continue
    }
  }

  console.log('모든 서버 등록 실패, 목업 응답 사용')
  
  // 모든 서버 연결 실패 시 목업 응답 사용
  const mockResponse: Senior = {
    senior_id: Date.now(), // 임시 ID 생성
    ...seniorData
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('목업 등록 응답:', mockResponse)
      resolve(mockResponse)
    }, 1000)
  })
}

// 어르신 정보 수정
export const updateSenior = async (seniorId: number, updateData: Partial<Senior>): Promise<void> => {
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
      console.log(`어르신 수정 시도 중: ${url}`)
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
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
