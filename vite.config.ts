// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Use the correct plugin for React

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], // Only include the React plugin here
})