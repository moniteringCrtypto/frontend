import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.BACKEND_URL || 'http://34.64.63.71:8080';

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
  
  // 경로 추출: rewrites에서 path 파라미터로 전달되거나 req.url에서 추출
  let pathString = '';
  
  // rewrites를 통해 전달된 경우
  if (req.query.path) {
    const pathParam = req.query.path;
    pathString = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
  } else {
    // 직접 호출된 경우 req.url에서 추출
    const url = req.url || '';
    const pathMatch = url.match(/^\/api\/proxy\/(.+?)(?:\?|$)/);
    pathString = pathMatch ? pathMatch[1] : '';
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
