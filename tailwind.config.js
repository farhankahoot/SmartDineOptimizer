/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Brand maroon — sampled from mockup buttons / active nav (#680000–#800000) */
        brand: {
          50: '#FDF3F3',
          100: '#FBE6E6',
          200: '#F4C7C7',
          300: '#E79B9B',
          400: '#D06565',
          500: '#B02C2E',
          600: '#94191C',
          700: '#7A1113', // primary
          800: '#5E0A0C',
          900: '#4A0709',
          bright: '#C0161A', // brighter active nav (communication mockup)
        },
        gold: {
          50: '#FDF9EF',
          100: '#FAF0D9',
          200: '#F0DDAE',
          300: '#E2C378',
          400: '#D4A537',
          500: '#C8A34A',
          600: '#A8801F',
          700: '#7E5F16',
        },
        ink: {
          DEFAULT: '#1B1B1F',
          soft: '#3F3F46',
          muted: '#6B7280',
          faint: '#9AA0A6',
        },
        line: {
          DEFAULT: '#EAEAEE',
          soft: '#F1F1F4',
          warm: '#EFE9E1',
        },
        page: '#F8F6F3',
        sidebar: {
          DEFAULT: '#0C0C0E',
          deep: '#08080A',
        },
        state: {
          success: '#1B7A3D',
          successBg: '#E4F4E9',
          successSolid: '#125E2E',
          warn: '#C2761C',
          warnBg: '#FDF0DC',
          danger: '#C0392B',
          dangerBg: '#FDEBE9',
          dangerSolid: '#E03B2F',
          info: '#2563EB',
          infoBg: '#E6EEFD',
          neutral: '#6B7280',
          neutralBg: '#ECECEF',
        },
        floor: {
          wood: '#EFE2C8',
          woodAlt: '#E7D7B8',
          wall: '#4A342A',
          green: '#6B9E52',
          greenDark: '#4E7A3B',
          red: '#B03A3A',
          redDark: '#8E2C2C',
          gold: '#D9A441',
          goldDark: '#B98424',
          grey: '#9E9C97',
          greyDark: '#7C7A75',
          blue: '#4A78C8',
          blueDark: '#3A5FA0',
        },
      },
      borderRadius: {
        card: '12px',
        panel: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 15, 14, 0.04), 0 1px 3px rgba(16, 15, 14, 0.03)',
        panel: '0 1px 3px rgba(16, 15, 14, 0.05), 0 4px 12px rgba(16, 15, 14, 0.04)',
        pop: '0 8px 28px rgba(16, 15, 14, 0.14)',
        navActive: '0 2px 10px rgba(122, 17, 19, 0.45)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        '3xs': ['9px', { lineHeight: '12px' }],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(6px) scale(.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },

        /* Landing-page motion. Slow and wide so it reads as atmosphere
           rather than as something demanding attention. */
        aurora: {
          '0%, 100%': { transform: 'translate3d(-6%, -3%, 0) scale(1)' },
          '50%': { transform: 'translate3d(6%, 4%, 0) scale(1.14)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        /* A highlight sweeping across a surface, used on the hero CTA. */
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '60%, 100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        /* Expanding ring behind the "live" dot. */
        'ping-soft': {
          '0%': { transform: 'scale(1)', opacity: '.55' },
          '80%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in .16s ease-out',
        'scale-in': 'scale-in .16s ease-out',
        'slide-in-left': 'slide-in-left .22s cubic-bezier(.32,.72,0,1)',
        aurora: 'aurora 19s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 34s linear infinite',
        sheen: 'sheen 4.5s ease-in-out infinite',
        'ping-soft': 'ping-soft 2.4s cubic-bezier(0,0,.2,1) infinite',
      },
    },
  },
  plugins: [],
}
