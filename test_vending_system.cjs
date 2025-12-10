const fetch = require('node-fetch');

const PROXY_URL = 'http://localhost:3001/api';

async function testTokenVending() {
    console.log('=== Token Vending System Check ===\n');

    try {
        // 1. Authentication
        console.log('1. Testing Authentication...');
        const captchaRes = await fetch(`${PROXY_URL}/v1/captcha`);
        if (!captchaRes.ok) {
            console.error('❌ Captcha failed:', captchaRes.status);
            return;
        }
        const captcha = await captchaRes.json();
        console.log('  ✅ Captcha loaded:', captcha.id);

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
            console.error('❌ Login failed:', loginData);
            return;
        }
        console.log('  ✅ Authenticated! Token:', loginData.token.substring(0, 20) + '...\n');

        // 2. Token Vending
        console.log('2. Testing Token Vending...');
        const meterNumber = '0128244428552'; // Test meter
        const amount = 10;

        const vendRes = await fetch(`${PROXY_URL}/v1/meter-recharge/recharge-token/0`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meterNo: meterNumber,
                money: amount
            })
        });

        console.log('  Status:', vendRes.status);
        const vendData = await vendRes.json();
        console.log('  Response:', JSON.stringify(vendData, null, 2));

        if (vendData.code === 200 && vendData.data && vendData.data.form) {
            console.log('\n✅ TOKEN VENDING WORKS!');
            console.log('  Token:', vendData.data.form);
            console.log('  Meter:', vendData.data.meterNo);
            console.log('  Transaction ID:', vendData.data.flowNo);
        } else {
            console.log('\n❌ Token vending failed:', vendData.msg || 'Unknown error');
        }

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    }
}

testTokenVending();
