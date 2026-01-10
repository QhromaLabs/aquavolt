
const https = require('https');

const urls = [
    'https://dlms.futurise-tech.com/api/v1/captcha',
    'https://dlms.futurise-tech.com/v1/captcha'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`URL: ${url}`);
        console.log(`Status: ${res.statusCode}`);
        // Read response to see if it's JSON or HTML
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Body Sample: ${data.substring(0, 100)}`);
            console.log('---');
        });
    }).on('error', (e) => {
        console.error(`Error fetching ${url}:`, e.message);
    });
});
