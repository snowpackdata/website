/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./assets/**/*.js"],
  theme: {
    colors: {
      'teal': '#226d87',
      'light-blue': '#ced9e1',
      'blue': '#021c51',
      'dark-blue': '#0a192f',
      'pink': '#be5bda',
      'orange': '#ff7849',
      'light-green': '#b5e7a0',
      'green': '#58837e',
      'gray-dark': '#22262a',
      'gray': '#d6d7d9',
      'gray-light': '#eeeff1',
      'white': '#ffffff',
      'yellow' : '#f7d070',
      'red': '#9f0d0d',
      'black': '#000000',
      'green-success': '#47d67c',
      'green-success-light': '#e5f3ec',
      'green-success-dark': '#186335',
      'red-error': '#f44336',
      'red-error-light': '#ffebee',
        'red-error-dark': '#b71c1c',



    },
    fontFamily: {
      sans: ['Montserrat', 'sans-serif'],
      serif: ['Georgia', 'serif'],
    },
    extend: {},
  },

  plugins: [
      require('@tailwindcss/forms'),
    ]
}

