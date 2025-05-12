import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT,
    SNOWFLAKE_USER: process.env.SNOWFLAKE_USER,
    SNOWFLAKE_PASSWORD: process.env.SNOWFLAKE_PASSWORD,
    SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE,
    SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE,
    SNOWFLAKE_SCHEMA: process.env.SNOWFLAKE_SCHEMA,
    LLM_KEY: process.env.LLM_KEY,
  },
  output: 'standalone',

};

export default nextConfig;
