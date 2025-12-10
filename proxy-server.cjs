const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');

// Debug imports
if (!fetch) console.error('CRITICAL: node-fetch failed to load');
if (!express) console.error('CRITICAL: express failed to load');

// Catch async errors to prevent immediate exit without log
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Futurise API base URL
const FUTURISE_BASE_URL = 'https://47.90.150.122:4680/api';

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false // Allow self-signed certificates
});

// Enable CORS
app.use(cors());
app.use(express.json()); // Parses application/json

// ============================================================================
// M-PESA ENDPOINTS
// ============================================================================


const MPESA_KEY = process.env.MPESA_KEY || 'Sk9iveI4ZAJ7PIbMyGgKLOozsd52xbCALmERpSzpif1V1gsd';
const MPESA_SECRET = process.env.MPESA_SECRET || 'K2qJMLSj8tgAeGXi6IpuW2ZEPUL72QoFvMXb7YQs6UoGBzbAQQqBtgo4Av83t3CL';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '4214025'; // Updated to match .env
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://aquavolt-production.up.railway.app/api/mpesa/callback';


app.post('/api/mpesa/stkpush', async (req, res) => {
    console.log('[Proxy] M-Pesa Request Received');
    try {
        if (!req.body) throw new Error('Request body is missing');
        const { phoneNumber, amount } = req.body;

        if (!phoneNumber || !amount) {
            return res.status(400).json({ success: false, message: 'Missing phone or amount' });
        }

        // 1. Get Access Token (PRODUCTION)
        const auth = Buffer.from(`${MPESA_KEY}:${MPESA_SECRET}`).toString('base64');
        const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}` }
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error('[Proxy] M-Pesa OAuth Error:', tokenRes.status, errorText);
            throw new Error(`Failed to get M-Pesa access token: ${tokenRes.status} - ${errorText}`);
        }
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. STK Push (PRODUCTION)
        const date = new Date();
        const timestamp = date.getFullYear() +
            ("0" + (date.getMonth() + 1)).slice(-2) +
            ("0" + date.getDate()).slice(-2) +
            ("0" + date.getHours()).slice(-2) +
            ("0" + date.getMinutes()).slice(-2) +
            ("0" + date.getSeconds()).slice(-2);

        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
        const stkUrl = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        let formattedPhone = phoneNumber.toString();
        if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.slice(1);
        if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);

        console.log(`[Proxy] Initiating STK Push to ${formattedPhone}`);

        const stkRes = await fetch(stkUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                "BusinessShortCode": MPESA_SHORTCODE,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": amount,
                "PartyA": formattedPhone,
                "PartyB": MPESA_SHORTCODE,
                "PhoneNumber": formattedPhone,
                "CallBackURL": MPESA_CALLBACK_URL,
                "AccountReference": "AquaVolt",
                "TransactionDesc": "Token Purchase"
            })
        });

        const stkData = await stkRes.json();
        console.log('[Proxy] M-Pesa Response:', stkData);

        if (stkData.ResponseCode === '0') {
            res.json({ success: true, data: stkData });
        } else {
            res.status(400).json({ success: false, message: stkData.errorMessage || 'STK Push Failed', data: stkData });
        }

    } catch (error) {
        console.error('[Proxy] M-Pesa Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// M-Pesa Callback Endpoint
app.post('/api/mpesa/callback', async (req, res) => {
    console.log('\n========================================');
    console.log('[M-Pesa Callback] Received at:', new Date().toISOString());
    console.log('[M-Pesa Callback] Body:', JSON.stringify(req.body, null, 2));
    console.log('========================================\n');

    // Always respond with success to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: 'Success' });

    // TODO: Process the callback data and update your database
    // The callback contains: MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, etc.
});

// ============================================================================
// FUTURISE PROXY
// ============================================================================

// ============================================================================
// FUTURISE PROXY (ROOT MAPPING for debugging)
// ============================================================================
app.use('/root', async (req, res) => {
    try {
        // Base URL without /api
        const BASE_URL = 'https://47.90.150.122:4680';
        const futuriseUrl = `${BASE_URL}${req.url}`;
        console.log(`[${new Date().toISOString()}] ProxyRoot -> ${req.method} ${req.url}`);

        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers,
            },
            agent: httpsAgent,
        };
        delete options.headers['host'];
        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(futuriseUrl, options);
        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        let data;

        try {
            if (contentType && contentType.includes('application/json')) {
                data = JSON.parse(responseText);
            } else {
                try { data = JSON.parse(responseText); } catch (e) { data = responseText; }
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            throw new Error(parseError.message);
        }

        console.log(`[${new Date().toISOString()}] RootResponse: ${response.status}`);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('ProxyRoot error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Original API Route
app.use('/api', async (req, res) => {
    try {
        const futuriseUrl = `${FUTURISE_BASE_URL}${req.url}`;
        console.log(`[${new Date().toISOString()}] Proxy -> ${req.method} ${req.url}`);

        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers,
            },
            agent: httpsAgent,
        };

        // Remove host header to avoid SSL issues
        delete options.headers['host'];

        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(futuriseUrl, options);



        const contentType = response.headers.get('content-type');
        const responseText = await response.text();
        let data;

        try {
            if (contentType && contentType.includes('application/json')) {
                data = JSON.parse(responseText);
            } else {
                // Try parsing anyway, or just return text
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    data = responseText;
                }
            }
        } catch (parseError) {
            console.error('JSON Parse Error for URL:', futuriseUrl);
            console.error('Raw Response:', responseText);
            throw new Error(`Invalid JSON from upstream: ${parseError.message}`);
        }

        console.log(`[${new Date().toISOString()}] Response: ${response.status}`);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('AquaVolt Proxy CJS is Running 🚀');
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AquaVolt Proxy listening on port ${PORT}`);
});
