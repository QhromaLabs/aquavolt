const fetch = require('node-fetch');

const PROXY_BASE_URL = 'http://localhost:3001/api';
// The path that failed (Single /api)
// PROXY mapped /api -> Remote /api
// So requesting /v1/captcha -> Remote /api/v1/captcha
const ENDPOINT = '/v1/captcha';

async function runTest() {
    console.log('--- Debugging 500 Error ---');
    try {
        const url = `${PROXY_BASE_URL}${ENDPOINT}`;
        console.log('Requesting:', url);

        const res = await fetch(url);

        console.log(`Status: ${res.status} ${res.statusText}`);
        const txt = await res.text();
        console.log('Response Body:');
        console.log(txt);

    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTest();
