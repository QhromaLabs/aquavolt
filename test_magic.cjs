const fetch = require('node-fetch');

const PROXY_URL = 'http://localhost:3001/api';

async function run() {
    console.log('--- Testing Magic Code vs Random Code ---');

    // 1. Get Captcha
    const captchaRes = await fetch(`${PROXY_URL}/v1/captcha`); // Using the working path
    if (!captchaRes.ok) { console.error('Captcha failed'); return; }
    const captchaData = await captchaRes.json();
    const uuid = captchaData.id;

    // Test 1: Random Code
    const randomCode = '9876';
    console.log(`Testing Random Code: ${randomCode}`);
    const res1 = await fetch(`${PROXY_URL}/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'aquavolt',
            password: '123456',
            rememberMe: false,
            uuid: uuid,
            code: randomCode
        })
    });
    const data1 = await res1.json();
    console.log('Response:', data1.success ? 'Success' : 'Fail');
    if (data1.success || data1.token) console.log('❌ Random code bypassed validation.');

    // Test 2: "0000" Code
    /* We already know 0000 works, but good to compare in one run */
}

run();
