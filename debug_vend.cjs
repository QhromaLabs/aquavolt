const fetch = require('node-fetch');

const PROXY_URL = 'http://localhost:3001/api';

async function debugVendEndpoint() {
    console.log('=== Debugging Vend Token Endpoint ===\n');

    // 1. Auth
    console.log('Step 1: Authenticating...');
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
    console.log('✅ Auth successful\n');

    // 2. Test different endpoint variations
    const meterNumber = '0128244428552';
    const amount = 10;

    const variations = [
        '/v1/meter-recharge/recharge-token/0',
        '/meter-recharge/recharge-token/0',
        '/v1/meter-recharge/recharge-token',
    ];

    for (const endpoint of variations) {
        console.log(`\n--- Testing: ${endpoint} ---`);
        const fullUrl = `${PROXY_URL}${endpoint}`;
        console.log('Full URL:', fullUrl);

        try {
            const res = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meterNo: meterNumber,
                    money: amount
                })
            });

            console.log('Status:', res.status);
            const text = await res.text();
            console.log('Response:', text);

            try {
                const data = JSON.parse(text);
                if (data.code === 200) {
                    console.log('\n🎉 SUCCESS! This endpoint works!');
                    console.log('Token:', data.data?.form);
                    break;
                }
            } catch (e) {
                // Not JSON
            }
        } catch (err) {
            console.log('Error:', err.message);
        }
    }
}

debugVendEndpoint();
