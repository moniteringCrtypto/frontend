import type { VercelRequest, VercelResponse } from '@vercel/node';

// 백엔드 URL 설정 및 검증
let BACKEND_URL = process.env.BACKEND_URL || 'http://34.64.63.71:80';

// URL 검증 및 수정 (오타 방지)
if (BACKEND_URL.includes('ㅗttp')) {
  BACKEND_URL = BACKEND_URL.replace('ㅗttp', 'http');
}
if (!BACKEND_URL.startsWith('http://') && !BACKEND_URL.startsWith('https://')) {
  BACKEND_URL = 'http://' + BACKEND_URL;
}
// 포트 80으로 통일 (nginx 사용)
if (BACKEND_URL.includes(':8080')) {
  BACKEND_URL = BACKEND_URL.replace(':8080', ':80');
}

console.log('[Proxy] Backend URL:', BACKEND_URL);

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
  
  // 경로 추출: rewrites에서 :path* 파라미터로 전달되거나 req.url에서 추출
  const url = req.url || '';
  let pathString = '';
  
  // 방법 1: rewrites를 통해 전달된 path 파라미터 사용
  if (req.query.path) {
    const pathParam = req.query.path;
    pathString = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
  }
  
  // 방법 2: req.url에서 직접 추출 (fallback)
  if (!pathString && url.startsWith('/api/proxy/')) {
    pathString = url.replace(/^\/api\/proxy\//, '').split('?')[0];
  }
  
  if (!pathString) {
    console.error('[Proxy] No path found.', {
      url: req.url,
      query: req.query
    });
    return res.status(400).json({ 
      error: 'No API path specified',
      url: req.url,
      query: req.query
    });
  }
  
  // 쿼리 파라미터는 req.query에서 가져오기 (path 제외)
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    if (key === 'path') return; // rewrites에서 전달된 path는 제외
    
    const value = req.query[key];
    if (typeof value === 'string') {
      queryParams[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      queryParams[key] = value[0];
    }
  });
  const queryString = new URLSearchParams(queryParams).toString();
  
  const backendUrl = `${BACKEND_URL}/api/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  // URL 최종 검증
  if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    console.error('[Proxy] Invalid backend URL:', backendUrl);
    return res.status(500).json({ 
      error: 'Invalid backend URL configuration',
      backendUrl 
    });
  }
  
  console.log(`[Proxy] ${req.method} ${req.url} -> ${backendUrl}`);
  
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
      console.error(`[Proxy] Backend error ${response.status}:`, errorText);
      return res.status(response.status).json({ error: errorText });
    }
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[Proxy] Fetch error:', error);
    res.status(500).json({ 
      error: error.message || 'Proxy request failed',
      backendUrl 
    });
  }
}
