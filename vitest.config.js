import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      SHOPIFY_API_KEY: 'test_api_key_12345',
      SHOPIFY_API_SECRET: 'test_api_secret_key_1234567890',
      HOST: 'https://test-app.myshopify.com',
      SCOPES: 'read_products',
      MONGODB_URI: 'mongodb://localhost:27017/shopify_test_cda',
    },
  },
});
