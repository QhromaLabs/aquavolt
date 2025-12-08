# Futurise API Proxy

This proxy server forwards requests from Supabase Edge Functions to the Futurise API (which is only accessible from local network).

## Environment Variables

- `PORT` - Server port (default: 3001)
- `FUTURISE_API_URL` - Futurise API base URL (default: https://47.90.150.122:4680)

## Deployment

This proxy is designed to be deployed on Railway.app, but can run on any Node.js hosting platform.

## Health Check

GET / or GET /health - Returns server status
