import type { NextConfig } from 'next';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Carrega .env da raiz do monorepo (mesmo padrão do backend).
loadEnv({ path: path.join(__dirname, '../../.env') });

// NEXT_PUBLIC_* precisa existir antes do build/dev. Se omitido, deriva de PORT do backend.
if (!process.env.NEXT_PUBLIC_API_URL) {
  const port = process.env.PORT ?? '3011';
  process.env.NEXT_PUBLIC_API_URL = `http://localhost:${port}`;
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
