# Supabase Edge Functions

Deploy these functions to Supabase:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref jfkvsducukwgqsljoisw

# Deploy functions
supabase functions deploy futurise-auth
supabase functions deploy futurise-vend-token
```

## Testing Functions

### 1. Test Authentication
```bash
curl -X POST https://jfkvsducukwgqsljoisw.supabase.co/functions/v1/futurise-auth \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### 2. Test Token Vending
```bash
curl -X POST https://jfkvsducukwgqsljoisw.supabase.co/functions/v1/futurise-vend-token \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "meterNumber": "0128244428552",
    "amount": 100,
    "phoneNumber": "254712345678"
  }'
```

## Function URLs

After deployment:
- Auth: `https://jfkvsducukwgqsljoisw.supabase.co/functions/v1/futurise-auth`
- Vend Token: `https://jfkvsducukwgqsljoisw.supabase.co/functions/v1/futurise-vend-token`
