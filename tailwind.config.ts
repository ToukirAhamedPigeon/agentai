import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',  // Optional if you use Pages Router
    './src/**/*.{js,ts,jsx,tsx}',    // If you use /src directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
