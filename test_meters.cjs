const fetch = require('node-fetch');

const PROXY_URL = 'http://localhost:3001/api';

async function testMeterEndpoints() {
    console.log('=== Testing Futurise Meter Endpoints ===\n');

    // 1. Authenticate
    console.log('1. Authenticating...');
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
    if (!loginData.token) {
        console.error('Auth failed:', loginData);
        return;
    }

    const token = loginData.token;
    console.log('✅ Authenticated!\n');

    // 2. Try common meter list endpoints
    const endpoints = [
        '/v1/meter/list',
        '/v1/meters',
        '/v1/device/list',
        '/v1/devices',
        '/v1/meter-info/list',
        '/v1/electricity-meter/list',
        '/v1/base-info/meter',
        '/v1/meter-recharge/meter-list'
    ];

    for (const endpoint of endpoints) {
        console.log(`Testing: ${endpoint}`);
        try {
            const res = await fetch(`${PROXY_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`  Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`  ✅ SUCCESS! Response:`, JSON.stringify(data, null, 2));
                break;
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
        }
        console.log();
    }
}

testMeterEndpoints();
