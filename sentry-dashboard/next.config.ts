import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * External packages
   * Module ini mengandung native code (C++) atau dynamic imports
   * yang tidak boleh dibundle oleh Webpack/Turbopack
   */
  serverExternalPackages: [
    'better-sqlite3',
    'mysql2',
    'pg',
    'bcryptjs'
  ],
};

export default nextConfig;
