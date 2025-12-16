import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.BACKEND_URL || 'http://34.64.63.71:80'; // nginx가 포트 80에서 실행 중

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 경로 추출: req.url에서 추출
  // Vercel Serverless Function에서 /api/proxy.ts는 /api/proxy로 매핑됨
  // /api/proxy/market/...로 요청이 오면 req.url은 /market/...가 됨
  let pathString = '';
  const url = req.url || '';
  
  console.log('[Proxy] Request URL:', url);
  console.log('[Proxy] Query params:', req.query);
  
  // 방법 1: /api/proxy/ 다음의 경로를 추출 (rewrites 사용 시)
  let pathMatch = url.match(/^\/api\/proxy\/(.+?)(?:\?|$)/);
  if (pathMatch) {
    pathString = pathMatch[1];
  } else {
    // 방법 2: /api/proxy 없이 직접 경로가 오는 경우 (Vercel의 기본 동작)
    // /market/...로 시작하는 경우
    if (url.startsWith('/')) {
      // 첫 번째 슬래시 제거
      pathString = url.split('?')[0].substring(1);
    }
    
    // 방법 3: 쿼리 파라미터에서 path 가져오기
    if (!pathString && req.query.path) {
      const pathParam = req.query.path;
      pathString = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
    }
  }
  
  if (!pathString) {
    console.error('[Proxy] No path found in URL:', url);
    return res.status(400).json({ error: 'No API path specified. URL: ' + url });
  }
  
  // 쿼리 파라미터는 req.query에서 가져오기 (path 제외)
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    // path는 제외 (rewrites에서 전달되는 경로 파라미터)
    if (key === 'path') return;
    
    const value = req.query[key];
    if (typeof value === 'string') {
      queryParams[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      queryParams[key] = value[0];
    }
  });
  const queryString = new URLSearchParams(queryParams).toString();
  
  const backendUrl = `${BACKEND_URL}/api/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`[Proxy] ${req.method} ${backendUrl}`, { url: req.url, pathString });
  
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
      return res.status(response.status).json({ error: errorText });
    }
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ error: error.message || 'Proxy request failed' });
  }
}
