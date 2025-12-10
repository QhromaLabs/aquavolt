import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    try {
        const body = await req.json()
        console.log("M-Pesa Callback Received:", JSON.stringify(body))
        return new Response(JSON.stringify({ result: "ok" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error) {
        console.error("Callback Error:", error)
        return new Response("ok", { status: 200 })
    }
})
