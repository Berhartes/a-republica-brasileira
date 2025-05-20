module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss')({
      config: './config/tailwind.config.js'
    }),
    require('autoprefixer')
  ]
}
