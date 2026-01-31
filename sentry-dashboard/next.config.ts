import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Note: Standalone mode disabled for custom server.js support
   * Using full node_modules in Docker instead
   */

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
