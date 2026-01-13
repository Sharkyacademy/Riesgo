const { default: themes } = require('daisyui/theme/object');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../../../templates/**/*.html',
    '../../../core/templates/**/*.html',
    '../../../**/templates/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'system-ui', 'sans-serif']
      },
    },
  },
  plugins: [require('daisyui')],
}