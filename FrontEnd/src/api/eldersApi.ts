// 어르신 관련 API 타입 정의
export interface Senior {
  senior_id: number
  name: string
  address: string
  health_info: string
}

// 어르신 목록 조회 API
export const getSeniors = async (): Promise<Senior[]> => {
  try {
    // 실제 API 호출 시도
    const response = await fetch('http://127.0.0.1:8000/api/v1/seniors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('실제 API 데이터:', data)
    return data
  } catch (error) {
    console.log('백엔드 서버 연결 실패, 목업 데이터 사용:', error.message)
    
    // 에러 발생 시 목업 데이터 사용
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
}

// 어르신 등록 API
export const createSenior = async (seniorData: Omit<Senior, 'senior_id'>): Promise<Senior> => {
  try {
    // 실제 API 호출 시도
    const response = await fetch('http://127.0.0.1:8000/api/v1/seniors', {
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
    return data
  } catch (error) {
    console.error('어르신 등록 실패:', error)
    
    // 에러 발생 시 목업 응답 사용
    const mockResponse: Senior = {
      senior_id: Date.now(), // 임시 ID 생성
      ...seniorData
    }
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockResponse), 1000)
    })
  }
}
