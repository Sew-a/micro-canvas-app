import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'

const remotePublicPath = import.meta.env.VITE_REMOTE_PUBLIC_PATH || '/';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'demos',
      filename: 'remoteEntry.js',
      publicPath: remotePublicPath,
      exposes: {
        './DemosApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
      },
      dts: false,
    }),
  ],
  server: {
    port: 3001,
  },
})
