const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Futurise API base URL
const FUTURISE_BASE_URL = 'https://47.90.150.122:4680';

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false // Allow self-signed certificates
});

// Enable CORS for all origins (Supabase edge functions need this)
app.use(cors());
app.use(express.json());

// Proxy all requests to Futurise
app.all('/api/*', async (req, res) => {
    try {
        const futurisePath = req.path.replace('/api', '');
        const futuriseUrl = `${FUTURISE_BASE_URL}${futurisePath}`;

        console.log(`[${new Date().toISOString()}] ${req.method} ${futurisePath}`);

        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers,
            },
            agent: httpsAgent,
        };

        // Add body for POST requests
        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(futuriseUrl, options);
        const data = await response.json();

        console.log(`[${new Date().toISOString()}] Response:`, response.status);

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        futuriseUrl: FUTURISE_BASE_URL,
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Futurise API Proxy Server Running    ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                            ║
║  Futurise: ${FUTURISE_BASE_URL}     ║
╚════════════════════════════════════════╝

Proxy ready to forward requests to Futurise API
  `);
});
