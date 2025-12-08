const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

// Futurise API base URL
const FUTURISE_BASE_URL = process.env.FUTURISE_API_URL || 'https://47.90.150.122:4680';

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

// Enable CORS for Supabase edge functions
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Futurise API Proxy',
        futuriseUrl: FUTURISE_BASE_URL,
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Proxy all /api/* requests to Futurise
app.all('/api/*', async (req, res) => {
    try {
        const futurisePath = req.path;
        const futuriseUrl = `${FUTURISE_BASE_URL}${futurisePath}`;

        console.log(`[${new Date().toISOString()}] ${req.method} ${futurisePath}`);

        const fetchModule = await import('node-fetch');
        const fetch = fetchModule.default;

        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
            agent: httpsAgent,
        };

        // Add body for POST requests
        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(futuriseUrl, options);
        const contentType = response.headers.get('content-type');

        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        console.log(`[${new Date().toISOString()}] Response: ${response.status}`);

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════╗
║   Futurise API Proxy Server Running    ║
╠════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(31)} ║
║  Futurise: ${FUTURISE_BASE_URL.padEnd(23)} ║
╚════════════════════════════════════════╝

Ready to proxy requests to Futurise API
  `);
});
