tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                harmony: {
                    bg: '#0A0A0C',
                    card: '#121215',
                    cardBorder: '#1F1F26',
                    red: '#E30613',
                    redHover: '#E30613',
                    redGlow: 'rgba(227, 6, 19, 0.4)',
                    grayText: '#A1A1AA',
                    darkSurface: '#16161A'
                }
            },
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
                brand: ['Montserrat', 'sans-serif'],
            },
            boxShadow: {
                'neon-red': '0 0 20px rgba(227, 6, 19, 0.35)',
                'neon-red-lg': '0 0 35px rgba(227, 6, 19, 0.5)',
                'card-glow': '0 10px 30px -10px rgba(0, 0, 0, 0.8)'
            }
        }
    }
};
