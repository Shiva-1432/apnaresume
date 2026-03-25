/* eslint-disable @typescript-eslint/no-require-imports */
const { apnaResumeTheme } = require('./config/theme');

module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: apnaResumeTheme,
      fontFamily: {
        sans: apnaResumeTheme.typography.fontFamily
      },
      boxShadow: apnaResumeTheme.shadows,
      borderRadius: apnaResumeTheme.borderRadius,
      spacing: apnaResumeTheme.spacing
    }
  },
  plugins: []
};
