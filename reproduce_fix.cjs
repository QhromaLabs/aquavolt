const fetch = require('node-fetch');

const PROXY_BASE_URL = 'http://localhost:3001/api';
// Testing the CLEAN path (removing the extra /api)
const ENDPOINTS = {
    captcha: '/v1/captcha',
    login: '/v1/login'
};

const VENDOR = 'aquavolt';
const PASSWORD = '123456';

async function runTest() {
    console.log('--- Starting CAPTCHA Bypass Test (Single /api) ---');
    try {
        // 1. Get Captcha
        const captchaUrl = `${PROXY_BASE_URL}${ENDPOINTS.captcha}`;
        console.log('Fetching Captcha from:', captchaUrl);

        const captchaRes = await fetch(captchaUrl);

        if (!captchaRes.ok) {
            const txt = await captchaRes.text();
            throw new Error(`Captcha fetch failed: ${captchaRes.status} ${txt}`);
        }
        const captchaData = await captchaRes.json();

        console.log('Captcha ID:', captchaData.id);

        // 2. Attempt Login with INTENTIONALLY WRONG code
        const wrongCode = '0000';
        console.log(`Attempting Login with Wrong Code: ${wrongCode} to ${PROXY_BASE_URL}${ENDPOINTS.login}`);

        const loginUrl = `${PROXY_BASE_URL}${ENDPOINTS.login}`;

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
            console.error('❌ FAIL: Login SUCCEEDED with wrong code! (Path issue not the cause?)');
        } else {
            console.log('✅ PASS: Login FAILED as expected (Validation Active!).');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTest();
