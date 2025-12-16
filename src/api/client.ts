import axios from 'axios';

// 환경 변수에서 API URL 가져오기
// 배포 환경에서는 VITE_API_BASE_URL 환경 변수를 설정해야 합니다
// 로컬 개발: http://localhost:5034/api
// 배포 환경: 실제 백엔드 API URL (예: https://your-backend-api.com/api)
const getApiBaseUrl = () => {
  // 환경 변수가 설정되어 있으면 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 프로덕션 환경에서는 직접 백엔드 URL 사용
  // Vercel rewrites가 작동하지 않을 경우를 대비해 직접 URL 사용
  if (import.meta.env.PROD) {
    const backendUrl = 'http://136.115.167.12:8080/api';
    console.warn(
      '⚠️ VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.\n' +
      `기본 백엔드 URL을 사용합니다: ${backendUrl}\n` +
      'Vercel 환경 변수에서 VITE_API_BASE_URL을 설정하는 것을 권장합니다.'
    );
    return backendUrl;
  }
  
  // 개발 환경에서는 localhost 사용
  return 'http://localhost:5034/api';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
