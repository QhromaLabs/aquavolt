import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { data: creds, error: credsError } = await supabaseClient
            .from('api_credentials')
            .select('credentials')
            .eq('service_name', 'futurise')
            .single()

        if (credsError) throw new Error('Failed to fetch Futurise credentials')

        const { base_url, vendor, password, endpoints } = creds.credentials

        console.log('Attempting to fetch captcha from:', `${base_url}${endpoints.captcha}`)

        // Step 1: Get CAPTCHA (with custom fetch options to handle self-signed cert)
        const captchaResponse = await fetch(`${base_url}${endpoints.captcha}`, {
            method: 'GET',
            // @ts-ignore - Deno specific option
            ...(base_url.startsWith('https://') && base_url.includes('47.90.150.122') ? {
                // For self-signed certificates, we need to disable certificate validation
                // This is safe for this specific known Futurise server
                agent: false
            } : {})
        })

        if (!captchaResponse.ok) {
            const errorText = await captchaResponse.text()
            console.error('Captcha fetch failed:', captchaResponse.status, errorText)
            throw new Error(`Failed to get captcha: ${captchaResponse.status} - ${errorText}`)
        }

        const captchaData = await captchaResponse.json()
        console.log('Captcha received:', captchaData)

        const { code: captchaCode, uuid } = captchaData

        if (!captchaCode || !uuid) {
            throw new Error('Invalid captcha response format')
        }

        // Step 2: Login with credentials
        console.log('Attempting login...')
        const loginResponse = await fetch(`${base_url}${endpoints.login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: vendor,
                password: password,
                rememberMe: false,
                code: captchaCode,
                uuid: uuid,
            }),
        })

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text()
            console.error('Login failed:', loginResponse.status, errorText)
            throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`)
        }

        const loginData = await loginResponse.json()
        console.log('Login response:', loginData)

        if (!loginData.success || !loginData.token) {
            throw new Error('Login unsuccessful: ' + (loginData.msg || 'Unknown error'))
        }

        const expiresAt = new Date(loginData.expire).toISOString()

        // Update credentials with new token
        await supabaseClient
            .from('api_credentials')
            .update({
                credentials: {
                    ...creds.credentials,
                    token: loginData.token,
                    token_expires_at: expiresAt,
                },
                updated_at: new Date().toISOString(),
            })
            .eq('service_name', 'futurise')

        // Log successful authentication
        await supabaseClient.from('futurise_sync_log').insert({
            sync_type: 'auth',
            status: 'success',
            items_synced: 1,
            response_data: { expires_at: expiresAt },
        })

        return new Response(
            JSON.stringify({
                success: true,
                token: loginData.token,
                expires_at: expiresAt,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Futurise auth error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
