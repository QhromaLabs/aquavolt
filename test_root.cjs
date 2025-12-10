const fetch = require('node-fetch');

// Map to ROOT of backend (no /api prefix)
const PROXY_ROOT_URL = 'http://localhost:3001/root';

const VENDOR = 'aquavolt';
const PASSWORD = '123456';

async function testPath(pathDescription, pathApi) {
    console.log(`\n--- Testing Path: ${pathDescription} ---`);
    try {
        // 1. Get Captcha
        const captchaUrl = `${PROXY_ROOT_URL}${pathApi}/v1/captcha`;
        console.log('Fetching Captcha from:', captchaUrl);

        const captchaRes = await fetch(captchaUrl);
        if (!captchaRes.ok) {
            console.log(`❌ Captcha Fetch Failed: ${captchaRes.status}`);
            return;
        }
        const captchaData = await captchaRes.json();
        console.log('Captcha ID:', captchaData.id);

        // 2. Login with WRONG code
        const wrongCode = '0000';
        const loginUrl = `${PROXY_ROOT_URL}${pathApi}/v1/login`;

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
        console.log(`Login Response (${loginRes.status}):`, JSON.stringify(loginData).substring(0, 100) + '...');

        if (loginData.success || loginData.token) {
            console.error('❌ FAIL: Login SUCCEEDED with wrong code! (Insecure Path)');
        } else {
            console.log('✅ PASS: Login FAILED (Secure Path Found!)');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

async function run() {
    // Test 1: /v1/captcha (No /api)
    await testPath('Root /v1', '');

    // Test 2: /api/v1/captcha (Double /api equivalent)
    await testPath('Root /api/v1', '/api');

    // Test 3: /web/v1/captcha (Common alternative)
    await testPath('Root /web/v1', '/web');
}

run();
