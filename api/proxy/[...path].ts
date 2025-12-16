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
  
  // Vercel의 [...path]는 req.query.path로 전달됨
  const pathArray = req.query.path;
  const pathString = Array.isArray(pathArray) 
    ? pathArray.join('/') 
    : (pathArray || '');
  
  // 쿼리 파라미터 처리
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    if (key !== 'path') {
      const value = req.query[key];
      if (typeof value === 'string') {
        queryParams[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        queryParams[key] = value[0];
      }
    }
  });
  const queryString = new URLSearchParams(queryParams).toString();
  
  const backendUrl = `${BACKEND_URL}/api/${pathString}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`[Proxy] ${req.method} ${backendUrl}`);
  
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
