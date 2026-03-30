const https = require('https');

const MESSAGING_API_TOKEN = 'fh2h3QoPICd6JSRftAQZpSh2eZNJFqCEcQ5acgCQpkVXH0MMAzGjYcFDC7AwjPDWisYAloPuHrxSpjfjzQikZI+rjtettWVPyv332RgzPJO+hPfs5Ctdk9tLILBoRQSxzzykjKT68PzgqfzPq0PjSAdB04t89/1O/w1cDnyilFU=';

function sendMessage(to, text) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify({
      to,
      messages: [{ type: 'text', text }]
    }));
    const req = https.request({
      hostname: 'api.line.me',
      path: '/v2/bot/message/push',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + MESSAGING_API_TOKEN,
        'Content-Length': body.length
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { to, message } = JSON.parse(event.body || '{}');
    if (!to || !message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing to or message' }) };

    const result = await sendMessage(to, message);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, result }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
