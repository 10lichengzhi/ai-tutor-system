const { getCORSHeaders, DEFAULT_MODEL, AGNES_API_KEY } = require('./_lib');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, getCORSHeaders(req));
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    ...getCORSHeaders(req),
  });
  res.end(JSON.stringify({
    status: 'healthy',
    service: 'AI智师导学系统 - AI代理服务',
    version: '1.2.0',
    default_model: DEFAULT_MODEL,
    api_key_configured: !!AGNES_API_KEY,
  }));
};
