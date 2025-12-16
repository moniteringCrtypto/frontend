import type { VercelRequest, VercelResponse } from '@vercel/node';

// 환경 변수에서 백엔드 URL 가져오기
const BACKEND_URL = process.env.BACKEND_URL || 'http://34.64.63.71:8080';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // req.url에서 경로 추출: /api/proxy/market/... -> market/...
  const url = req.url || '';
  const pathMatch = url.match(/^\/api\/proxy\/(.+)$/);
  const pathString = pathMatch ? pathMatch[1] : '';
  
  // 쿼리 파라미터 추출
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    const value = req.query[key];
    if (typeof value === 'string') {
      queryParams[key] = value;
    } else if (Array.isArray(value)) {
      queryParams[key] = value[0];
    }
  });
  const queryString = new URLSearchParams(queryParams).toString();
  
  const backendUrl = `${BACKEND_URL}/api/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`[Proxy] ${req.method} ${backendUrl}`, {
    originalUrl: req.url,
    pathString,
    queryParams,
    backendUrl
  });
  
  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Backend error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ error: error.message || 'Proxy request failed' });
  }
}
