const https = require('https');

const LINE_LOGIN_CHANNEL_ID = '2009641385';
const LINE_LOGIN_CHANNEL_SECRET = 'f6bd063306c1e8d3846c1b001eef22c8';
const REDIRECT_URI = 'https://voluble-granita-401749.netlify.app/line-callback.html';

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(body);
    const req = https.request({ hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': data.length } }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve(raw); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function httpsGet(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve(raw); } });
    });
    req.on('error', reject);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');
    if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };

    // Exchange code for token
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: LINE_LOGIN_CHANNEL_ID,
      client_secret: LINE_LOGIN_CHANNEL_SECRET,
    }).toString();

    const tokenRes = await httpsPost('api.line.me', '/oauth2/v2.1/token',
      { 'Content-Type': 'application/x-www-form-urlencoded' }, tokenBody);

    if (!tokenRes.access_token) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token exchange failed', detail: tokenRes }) };
    }

    // Get user profile
    const profile = await httpsGet('api.line.me', '/v2/profile',
      { 'Authorization': 'Bearer ' + tokenRes.access_token });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
      })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
