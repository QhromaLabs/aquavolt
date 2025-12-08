import https from 'https';
import fetch from 'node-fetch';

// Create HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Get the path from the request URL
        // Vercel rewrites /futurise-api/v1/captcha -> /api/proxy?path=v1/captcha (sort of, or just passes the full url)
        // We need to extract the path. 
        // The rewrite usage means req.url might be /api/proxy

        // Let's rely on the query or manual parsing if rewrite doesn't pass params nicely.
        // Actually, getting the path from the original URL is safer.

        // Construct Futurise URL
        // Original relative path: /futurise-api/v1/captcha
        // Target: https://47.90.150.122:4680/api/v1/captcha

        const url = new URL(req.url, `http://${req.headers.host}`);
        // Extract path after /futurise-api (handled by vercel.json rewrite logic mostly, but let's be robust)

        // Simple approach: The proxy receives the request. We forward it to Futurise.
        // But Vercel "Rewrite" maps path to script. The script needs to know the original path.
        // Let's use a query param 'endpoint' to be safe, or just assume the structure.

        // BETTER APPROACH: Just use a standard catch-all route file: api/[...path].js
        // But since I'm making this distinct, let's stick to the mapped proxy.

        // Let's correct the Vercel rewrite to pass the path as a query param or use a catch-all route.
        // Changing strategy: api/proxy.js handling everything is complex without path info.
        // I will use api/index.js as a catch-all or simply parse `req.url`.

        // On Vercel, req.url will be the rewritten URL.

        const FUTURISE_BASE = 'https://47.90.150.122:4680/api';

        // We need to know what to append.
        // Let's grab it from the request URL if possible, or pass it via headers.

        // SIMPLER: Modify vercel.json to use a destination with query
        // "destination": "/api/proxy?slug=$1"

        const slug = req.query.slug || '';
        const targetUrl = `${FUTURISE_BASE}/${slug}`;

        console.log(`Proxying to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                // Forward auth headers if present
                ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
            },
            body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
            agent: httpsAgent
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
