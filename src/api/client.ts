import axios from 'axios';

// 환경 변수에서 API URL 가져오기
// 배포 환경에서는 VITE_API_BASE_URL 환경 변수를 설정해야 합니다
// 로컬 개발: http://localhost:5034/api
// 배포 환경: 실제 백엔드 API URL (예: https://your-backend-api.com/api)
const getApiBaseUrl = () => {
  // 개발 환경 체크: localhost에서 실행 중이면 개발 환경
  const isDevelopment = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '');
  
  // 개발 환경이면 localhost 사용
  if (isDevelopment) {
    return 'http://localhost:5034/api';
  }
  
  // 프로덕션 환경 (Vercel 배포)
  // Vercel Serverless Function 프록시 사용
  // /api/proxy.ts가 /api/proxy/* 경로를 처리
  return '/api/proxy';
};

const API_BASE_URL = getApiBaseUrl();

// 디버깅: 실제 사용되는 API URL 확인
const isDevelopment = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '');
   
if (!isDevelopment) {
  console.log('🔍 API Base URL:', API_BASE_URL);
  console.log('🔍 Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');
  console.log('🔍 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('🔍 MODE:', import.meta.env.MODE);
  console.log('🔍 PROD:', import.meta.env.PROD);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 실제 요청 URL 확인
apiClient.interceptors.request.use(
  (config) => {
    const isDevelopment = 
      typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '');
       
    if (!isDevelopment) {
      const baseURL = config.baseURL || '';
      const url = config.url || '';
      const fullUrl = baseURL + url;
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: url,
        baseURL: baseURL,
        fullURL: fullUrl,
        params: config.params,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 서버가 응답을 반환했지만 상태 코드가 에러 범위에 있음
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Unknown error';
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // 더 자세한 에러 메시지를 포함한 새로운 에러 생성
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = error.response.status;
      (enhancedError as any).response = error.response;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // 요청이 전송되었지만 응답을 받지 못함
      console.error('API Request Error: No response received', {
        url: error.config?.url,
        message: error.message,
      });
      return Promise.reject(new Error('Network error: Unable to reach the server'));
    } else {
      // 요청 설정 중 에러 발생
      console.error('API Setup Error:', error.message);
    return Promise.reject(error);
    }
  }
);
