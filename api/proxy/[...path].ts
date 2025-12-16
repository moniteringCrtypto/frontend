import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'http://136.115.167.12:8080';

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
  
  // Vercel의 [...path]는 배열로 전달됨
  const pathArray = req.query.path as string[] | string | undefined;
  const pathString = Array.isArray(pathArray) 
    ? pathArray.join('/') 
    : pathArray || '';
  
  // 쿼리 파라미터에서 path 제외하고 나머지만 사용
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    if (key !== 'path') {
      const value = req.query[key];
      if (typeof value === 'string') {
        queryParams[key] = value;
      } else if (Array.isArray(value)) {
        queryParams[key] = value[0];
      }
    }
  });
  const queryString = new URLSearchParams(queryParams).toString();
  
  const url = `${BACKEND_URL}/api/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`[Proxy] ${req.method} ${url}`, {
    pathArray,
    pathString,
    queryParams,
    fullUrl: url
  });
  
  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ error: error.message || 'Proxy request failed' });
  }
}

