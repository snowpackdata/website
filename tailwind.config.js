/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./assets/**/*.js"],
  theme: {
    colors: {
      'teal': '#226d87',
      'blue': '#021c51',
      'pink': '#ff49db',
      'orange': '#ff7849',
      'green': '#58837e',
      'gray-dark': '#22262a',
      'gray': '#d6d7d9',
      'gray-light': '#eeeff1',
      'white': '#ffffff',
      'yellow' : '#f7d070',
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

