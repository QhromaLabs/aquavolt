# Setting up ngrok for M-Pesa Callback on Localhost

## Why You Need This
M-Pesa needs to send payment confirmations to your callback URL. Since you're on localhost, M-Pesa can't reach you directly. ngrok creates a public URL that tunnels to your localhost.

## Steps:

### 1. Install ngrok
```bash
# Download from https://ngrok.com/download
# Or use chocolatey on Windows:
choco install ngrok
```

### 2. Start your proxy server
```bash
npm run proxy
# Should be running on http://localhost:3001
```

### 3. Start ngrok tunnel
```bash
ngrok http 3001
```

This will give you a public URL like: `https://abc123.ngrok.io`

### 4. Update your callback URL in proxy-server.cjs
Change line 101 to use your ngrok URL:
```javascript
"CallBackURL": "https://YOUR-NGROK-URL.ngrok.io/api/mpesa/callback",
```

### 5. Register the callback URL in M-Pesa Portal
- Log into your M-Pesa Business Portal
- Go to your app settings
- Add the ngrok callback URL to the whitelist

## Alternative: localtunnel (no signup required)
```bash
npx localtunnel --port 3001
```

## Important Notes:
- ngrok free URLs change every time you restart
- You'll need to update the callback URL each time
- For production, use a permanent hosted solution (Railway, Heroku, etc.)
