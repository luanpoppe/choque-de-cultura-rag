import type { NextConfig } from 'next';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Carrega .env da raiz do monorepo (mesmo padrão do backend).
loadEnv({ path: path.join(__dirname, '../../.env') });

const nextConfig: NextConfig = {};

export default nextConfig;
