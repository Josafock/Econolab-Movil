const fs = require('node:fs');
const https = require('node:https');
const http = require('node:http');
if (process.env.NODE_ENV !== 'test') throw new Error('El proxy TLS solo funciona en QA.');
const server = https.createServer(
  {
    key: fs.readFileSync('.native-qa/renewal.key'),
    cert: fs.readFileSync('.native-qa/renewal-chain.pem'),
  },
  (req, res) => {
    const upstream = http.request(
      {
        hostname: '127.0.0.1',
        port: 3109,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (response) => {
        res.writeHead(response.statusCode || 502, response.headers);
        response.pipe(res);
      },
    );
    upstream.on('error', () => {
      res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  },
);
server.listen(3111, '127.0.0.1');
process.once('SIGTERM', () => server.close());
