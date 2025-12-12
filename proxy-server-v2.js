import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import https from 'https';

const app = express();
const PORT = process.env.PORT || process.env.PROXY_PORT || 3002;

// Futurise API base URL
const FUTURISE_BASE_URL = 'https://47.90.150.122:4680';

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false // Allow self-signed certificates
});

// Enable CORS
app.use(cors());
app.use(express.json());

// ============================================================================
// M-PESA ENDPOINTS
// ============================================================================

// M-Pesa Credentials
const MPESA_KEY = process.env.MPESA_KEY || 'Sk9iveI4ZAJ7PIbMyGgKLOozsd52xbCALmERpSzpif1V1gsd';
const MPESA_SECRET = process.env.MPESA_SECRET || 'K2qJMLSj8tgAeGXi6IpuW2ZEPUL72QoFvMXb7YQs6UoGBzbAQQqBtgo4Av83t3CL';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379'; // Test Shortcode
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        console.log('[Proxy] M-Pesa Request:', req.body);
        const { phoneNumber, amount } = req.body;

        if (!phoneNumber || !amount) {
            return res.status(400).json({ success: false, message: 'Missing phone or amount' });
        }

        // 1. Get Access Token
        // Use node-fetch for this too
        const auth = Buffer.from(`${MPESA_KEY}:${MPESA_SECRET}`).toString('base64');
        const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}` }
        });

        if (!tokenRes.ok) throw new Error('Failed to get M-Pesa access token');
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. STK Push
        const date = new Date();
        const timestamp = date.getFullYear() +
            ("0" + (date.getMonth() + 1)).slice(-2) +
            ("0" + date.getDate()).slice(-2) +
            ("0" + date.getHours()).slice(-2) +
            ("0" + date.getMinutes()).slice(-2) +
            ("0" + date.getSeconds()).slice(-2);

        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
        const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        let formattedPhone = phoneNumber.toString();
        if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.slice(1);
        if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);

        console.log(`[Proxy] Initiating STK Push to ${formattedPhone} for KES ${amount}`);

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
                "CallBackURL": "https://aquavolt-production.up.railway.app/api/mpesa/callback", // Dummy
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

// ============================================================================
// FUTURISE PROXY
// ============================================================================

app.use('/api', async (req, res) => {
    try {
        const futuriseUrl = `${FUTURISE_BASE_URL}${req.url}`;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

        // node-fetch v2 options
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers,
            },
            agent: httpsAgent, // Crucial for self-signed certs
        };

        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(futuriseUrl, options);

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Read text
            data = await response.text();
            try { data = JSON.parse(data); } catch (e) { }
        }

        console.log(`[${new Date().toISOString()}] Response:`, response.status);
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
    res.send('AquaVolt Proxy v2 (ESM) is Running 🚀');
});


const server = app.listen(PORT, '0.0.0.0', () => {
    const address = server.address();
    if (!address) {
        console.error('Failed to get server address');
        return;
    }
    console.log(`
╔════════════════════════════════════════╗
║   AquaVolt Proxy Server v2 (ESM)       ║
╠════════════════════════════════════════╣
║  Address: ${address.address}                   ║
║  Port: ${address.port}                            ║
║  M-Pesa: Enabled (Sandbox)             ║
╚════════════════════════════════════════╝
  `);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`Try using a different port: PORT=3003 node proxy-server-v2.js\n`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

