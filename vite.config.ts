import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { federation } from '@module-federation/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const remotePublicPath = env.VITE_REMOTE_PUBLIC_PATH || '/';

  return {
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
          react: { singleton: true },
          'react/': { singleton: true },
          'react-dom': { singleton: true },
          'react-dom/': { singleton: true },
        },
        dts: false,
      }),
    ],
    server: {
      port: 3001,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  };
});
