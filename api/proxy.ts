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
  
  // req.url에서 경로 추출
  // /api/proxy/market/Binance/BTCUSDT/ticker?marketType=Spot
  // -> market/Binance/BTCUSDT/ticker
  const url = req.url || '';
  let pathString = '';
  
  // /api/proxy/ 다음의 경로 추출
  if (url.startsWith('/api/proxy/')) {
    pathString = url.replace(/^\/api\/proxy\//, '').split('?')[0];
  } else if (url.startsWith('/api/proxy')) {
    // /api/proxy만 오는 경우 (뒤에 경로 없음)
    pathString = '';
  }
  
  if (!pathString) {
    console.error('[Proxy] No path found.', {
      url: req.url,
      query: req.query
    });
    return res.status(400).json({ 
      error: 'No API path specified',
      url: req.url
    });
  }
  
  // 쿼리 파라미터는 req.query에서 가져오기
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach(key => {
    const value = req.query[key];
    if (typeof value === 'string') {
      queryParams[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      queryParams[key] = value[0];
    }
  });
  const queryString = new URLSearchParams(queryParams).toString();
  
  const backendUrl = `${BACKEND_URL}/api/${pathString}${queryString ? `?${queryString}` : ''}`;
  
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
