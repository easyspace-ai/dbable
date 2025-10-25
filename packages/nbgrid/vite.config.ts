import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react()
  ],
  root: '.',
  publicDir: 'public',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NbGrid',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@glideapps/glide-data-grid'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@glideapps/glide-data-grid': 'GlideDataGrid'
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  server: {
    port: 3100,
    open: true,
    host: true
  }
})