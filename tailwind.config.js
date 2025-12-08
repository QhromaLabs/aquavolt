/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                aquavolt: {
                    primary: '#1ecf49',
                    secondary: '#36ea98',
                    dark: '#0a1f1a',
                    light: '#e8f9f0',
                },
            },
        },
    },
    plugins: [],
    corePlugins: {
        preflight: false, // Disable Tailwind's base styles to avoid conflicts with Ant Design
    },
}
