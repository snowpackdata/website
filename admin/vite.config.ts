import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  base: '/admin/', // Set the base path to /admin/
  build: {
    outDir: '../static/admin', // Output to the static directory where Go server can access
    emptyOutDir: true,
    sourcemap: false
  }
})
