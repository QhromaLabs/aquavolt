const fetch = require('node-fetch');

const PROXY_URL = 'http://localhost:3001/api';

async function testMeterEndpoints() {
    console.log('=== Testing Futurise Meter Endpoints (POST) ===\n');

    // 1. Authenticate
    const captchaRes = await fetch(`${PROXY_URL}/v1/captcha`);
    const captcha = await captchaRes.json();

    const loginRes = await fetch(`${PROXY_URL}/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'aquavolt',
            password: '123456',
            rememberMe: false,
            code: '0000',
            uuid: captcha.id
        })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Authenticated!\n');

    // 2. Try POST with pagination
    console.log('Testing: POST /v1/electricity-meter/list');
    const res = await fetch(`${PROXY_URL}/v1/electricity-meter/list`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            page: 1,
            pageSize: 100
        })
    });

    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
}

testMeterEndpoints();
