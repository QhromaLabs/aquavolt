
const https = require('https');

const options = {
    hostname: 'dlms.futurise-tech.com',
    port: 4680,
    path: '/api/v1/captcha',
    method: 'GET',
    rejectUnauthorized: false,
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`URL: https://${options.hostname}:${options.port}${options.path}`);
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Body Sample: ${data.substring(0, 100)}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
