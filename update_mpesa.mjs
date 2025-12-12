import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jfkvsducukwgqsljoisw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impma3ZzZHVjdWt3Z3FzbGpvaXN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU3NzQzMiwiZXhwIjoyMDQ5MTUzNDMyfQ.BybF3GtMK_d5VTpmx4-vNCh77zn3QT1GQr8wJ-l_Xww'
);

async function updateMpesaCredentials() {
    const { data, error } = await supabase
        .from('api_credentials')
        .update({
            credentials: {
                consumer_key: 'Sk9iveI4ZAJ7PIbMyGgKLOozsd52xbCALmERpSzpif1V1gsd',
                consumer_secret: 'K2qJMLSj8tgAeGXi6IpuW2ZEPUL72QoFvMXb7YQs6UoGBzbAQQqBtgo4Av83t3CL',
                shortcode: '4214025',
                passkey: 'c0e6dae35f30d2ea3903ef2f5d377f43778b8530552f14ff1b390a8006385f8f'
            }
        })
        .eq('service_name', 'mpesa')
        .select();

    if (error) {
        console.error('Error updating credentials:', error);
    } else {
        console.log('✅ M-Pesa credentials updated successfully!');
        console.log('Updated record:', data);
    }
}

updateMpesaCredentials();
