const fetch = require('node-fetch');

// Using the working proxy endpoint
const PROXY_URL = 'http://localhost:3001/api';

async function run() {
    console.log('--- Testing CAPTCHA Field Names ---');

    // 1. Get Captcha (assuming this works as per logs)
    const captchaRes = await fetch(`${PROXY_URL}/v1/captcha`);
    if (!captchaRes.ok) {
        console.error('Captcha fetch failed');
        return;
    }
    const captchaData = await captchaRes.json();
    const uuid = captchaData.id;
    console.log('Got Captcha ID:', uuid);

    const WRONG_CODE = '0000';
    const fieldNames = [
        'code',         // Current
        'captcha',
        'captchaCode',
        'verifyCode',
        'vCode',
        'checkCode',
        'validCode',
        'imageCode'
    ];

    // Also UUID field names?
    const uuidFields = ['uuid', 'captchaId', 'key', 'id'];

    const loginUrl = `${PROXY_URL}/v1/login`;

    for (const codeField of fieldNames) {
        console.log(`\nTesting field: "${codeField}" with value "0000"...`);

        const body = {
            username: 'aquavolt',
            password: '123456',
            rememberMe: false,
            uuid: uuid // Keep uuid constant for this loop
        };
        body[codeField] = WRONG_CODE;

        const res = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.success || data.token) {
            console.log(`❌ Succeeded (Bypass) - "${codeField}" is IGNORED.`);
        } else {
            console.log(`✅ FAILED (Enforced!) - "${codeField}" might be the key!`);
            console.log('Response:', data);
        }
    }
}

run();
