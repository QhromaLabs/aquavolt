UPDATE api_credentials 
SET credentials = jsonb_build_object(
    'consumer_key', 'Sk9iveI4ZAJ7PIbMyGgKLOozsd52xbCALmERpSzpif1V1gsd',
    'consumer_secret', 'K2qJMLSj8tgAeGXi6IpuW2ZEPUL72QoFvMXb7YQs6UoGBzbAQQqBtgo4Av83t3CL',
    'shortcode', '4214025',
    'passkey', 'c0e6dae35f30d2ea3903ef2f5d377f43778b8530552f14ff1b390a8006385f8f'
)
WHERE service_name = 'mpesa';
