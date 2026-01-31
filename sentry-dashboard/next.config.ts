import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Enable standalone output for Docker deployment
   * This creates a minimal production bundle with all dependencies
   */
  output: 'standalone',

  /*
   * External packages
   * Module ini mengandung native code (C++) atau dynamic imports
   * yang tidak boleh dibundle oleh Webpack/Turbopack
   */
  serverExternalPackages: [
    'better-sqlite3',
    'mysql2',
    'pg',
    'bcryptjs',
    'ssh2'
  ],
};

export default nextConfig;
