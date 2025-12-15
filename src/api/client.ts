import axios from 'axios';

// 환경 변수에서 API URL 가져오기, 없으면 기본값 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5034/api';

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
