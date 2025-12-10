const fetch = require('node-fetch');

const PROXY_BASE_URL = 'http://localhost:3001/api';
// Endpoints matching EXACTLY what is in futuriseDev.js
const ENDPOINTS = {
    captcha: '/api/v1/captcha',
    login: '/api/v1/login'
};

const VENDOR = 'aquavolt';
const PASSWORD = '123456';

async function runTest() {
    console.log('--- Starting CAPTCHA Bypass Test (Double /api) ---');
    try {
        // 1. Get Captcha
        console.log('1. Fetching Captcha...');
        const captchaUrl = `${PROXY_BASE_URL}${ENDPOINTS.captcha}`;
        console.log('URL:', captchaUrl);

        const captchaRes = await fetch(captchaUrl);

        if (!captchaRes.ok) {
            const txt = await captchaRes.text();
            throw new Error(`Captcha fetch failed: ${captchaRes.status} ${txt}`);
        }
        const captchaData = await captchaRes.json();

        console.log('Captcha ID:', captchaData.id);

        // 2. Attempt Login with INTENTIONALLY WRONG code
        const wrongCode = '0000';
        console.log(`2. Attempting Login with Wrong Code: ${wrongCode}`);

        const loginUrl = `${PROXY_BASE_URL}${ENDPOINTS.login}`;
        console.log('URL:', loginUrl);

        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: VENDOR,
                password: PASSWORD,
                rememberMe: false,
                code: wrongCode,
                uuid: captchaData.id
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Response Status:', loginRes.status);
        console.log('Login Response Data:', JSON.stringify(loginData, null, 2));

        if (loginData.success || loginData.token) {
            console.error('❌ CRITICAL: Login SUCCEEDED with wrong code! Backend is bypassing CAPTCHA.');
        } else {
            console.log('✅ PASS: Login correctly failed with wrong code.');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTest();
