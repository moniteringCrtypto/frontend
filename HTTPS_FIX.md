# HTTPS/HTTP Mixed Content 문제 해결 가이드

## 문제
프론트엔드가 HTTPS로 서비스되고 백엔드가 HTTP로 서비스되어 Mixed Content 문제로 통신이 안 되는 경우

## 해결 방법

### 1. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

1. **Vercel 프로젝트로 이동**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Settings > Environment Variables** 클릭

3. **새 환경 변수 추가**:
   - **Name**: `BACKEND_URL`
   - **Value**: `http://34.64.63.71:8080`
   - **Environment**: Production, Preview, Development 모두 선택
   
   > 참고: 기본값이 이미 `http://34.64.63.71:8080`으로 설정되어 있지만, 명시적으로 설정하는 것을 권장합니다.

4. **Save** 클릭

5. **프로젝트 재배포**:
   - Deployments 탭에서 최신 배포의 "Redeploy" 클릭
   - 또는 코드를 다시 푸시하면 자동 재배포됨

### 2. 작동 원리

프론트엔드는 Vercel Serverless Function 프록시(`/api/proxy`)를 통해 백엔드와 통신합니다:

1. 프론트엔드에서 API 요청: `/api/proxy/market/Binance/BTCUSDT/ticker`
2. Vercel Serverless Function이 요청을 받음
3. 프록시 함수가 백엔드로 요청 전달: `http://BACKEND_IP:8080/api/market/Binance/BTCUSDT/ticker`
4. 백엔드 응답을 프론트엔드로 전달

이렇게 하면 브라우저는 HTTPS로만 통신하고, 실제 HTTP 백엔드 통신은 서버 사이드에서 이루어집니다.

### 3. 확인 방법

1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭 확인
3. API 요청이 `/api/proxy/...`로 가는지 확인 (HTTPS)
4. Console 탭에서 프록시 로그 확인:
   - `[Proxy] Request URL: ...`
   - `[Proxy] GET http://BACKEND_IP:8080/api/...`

### 4. 백엔드 IP

현재 백엔드 IP: `34.64.63.71:8080`

프록시 코드의 기본값이 이미 이 IP로 설정되어 있으므로, Vercel 환경 변수를 설정하지 않아도 작동합니다. 하지만 명시적으로 설정하는 것을 권장합니다.

### 5. 문제 해결

#### 프록시가 작동하지 않는 경우

1. **Vercel 로그 확인**:
   - Vercel 대시보드 > 프로젝트 > Functions 탭
   - `/api/proxy` 함수의 로그 확인

2. **환경 변수 확인**:
   - `BACKEND_URL`이 올바르게 설정되었는지 확인
   - 재배포 후에도 적용되었는지 확인

3. **백엔드 연결 확인**:
   ```bash
   curl http://34.64.63.71:8080/api/market/Binance/BTCUSDT/ticker
   ```

#### CORS 에러가 발생하는 경우

백엔드의 CORS 설정에 Vercel 도메인이 추가되어 있는지 확인하세요:
- `https://your-frontend.vercel.app`

백엔드 `appsettings.json` 또는 환경 변수에서 확인:
```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://your-frontend.vercel.app"
    ]
  }
}
```

## 장기적 해결책: 백엔드에 HTTPS 설정

더 나은 해결책은 백엔드에도 HTTPS를 설정하는 것입니다:

1. 도메인 필요 (예: `api.yourdomain.com`)
2. `quaternion_backend/SETUP_HTTPS.md` 참고
3. Let's Encrypt로 무료 SSL 인증서 발급
4. Nginx를 리버스 프록시로 사용

HTTPS 설정 후 프론트엔드에서 직접 백엔드 API를 호출할 수 있습니다.
