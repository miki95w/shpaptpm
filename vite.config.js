import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { handleMockApi } from './mock-backend.js'

function mockApiPlugin() {
  return {
    name: 'mock-api-plugin',
    configureServer(server) {
      server.middlewares.use(handleMockApi);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true
  }
})
