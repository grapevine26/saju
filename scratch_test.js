const https = require('https');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/RESEND_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/emails/f2a57c83-c9... wait, I will use d61821b7-24e0-4072-9bb6-2c0e90f9c61d',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  }
};
options.path = '/emails/d61821b7-24e0-4072-9bb6-2c0e90f9c61d';

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => console.log(data));
});
req.on('error', (e) => console.error(e));
req.end();
