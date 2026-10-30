import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../web/config/db.js';

let mongod = null;

export async function setupTestDB() {
  process.env.NODE_ENV = 'test';
  process.env.SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || 'test_api_key_12345';
  process.env.SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || 'test_api_secret_key_1234567890';
  process.env.HOST = process.env.HOST || 'https://test-app.myshopify.com';
  process.env.SCOPES = process.env.SCOPES || 'read_products';

  const localUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_test_cda';
  try {
    await connectDB(localUri);
  } catch {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await connectDB(uri);
  }
}

import { Timer } from '../web/models/timer.model.js';
import { Analytics } from '../web/models/analytics.model.js';

export async function clearTestDB() {
  await Timer.deleteMany({});
  await Analytics.deleteMany({});
}

export async function teardownTestDB() {
  await disconnectDB();
  if (mongod) {
    await mongod.stop();
  }
}
