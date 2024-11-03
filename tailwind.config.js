// tailwind.config.js
// TODO this is NOT connected to the actual index.html file, this is only so the tailwind config extension picks up the tailwind project
module.exports = {
  content: [
    "./*.html", // Adjust this path based on where your HTML files are located
    "./src/**/*.{html,js}", // Include all HTML and JS files in the src directory
  ],
  theme: {},
  plugins: [],
};