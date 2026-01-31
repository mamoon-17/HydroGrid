const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';
const PROJECT_PATH =
  process.env.PROJECT_PATH || '/path/to/your/backend/project';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const signature = req.headers['x-hub-signature-256'];
        const expectedSignature = `sha256=${crypto
          .createHmac('sha256', WEBHOOK_SECRET)
          .update(body)
          .digest('hex')}`;

        if (signature !== expectedSignature) {
          console.log('Invalid signature');
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }

        const payload = JSON.parse(body);

        // Only deploy on push to main branch
        if (payload.ref === 'refs/heads/main') {
          console.log('Deploying from webhook...');

          exec(`cd ${PROJECT_PATH} && ./build.sh`, (error, stdout, stderr) => {
            if (error) {
              console.error('Deployment error:', error);
              res.writeHead(500);
              res.end('Deployment failed');
              return;
            }
            console.log('Deployment successful:', stdout);
            res.writeHead(200);
            res.end('Deployment successful');
          });
        } else {
          res.writeHead(200);
          res.end('Ignored - not main branch');
        }
      } catch (error) {
        console.error('Webhook error:', error);
        res.writeHead(400);
        res.end('Bad request');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
