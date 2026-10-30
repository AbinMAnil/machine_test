import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(customUri) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri =
    customUri ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/shopify_countdown_timer';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    throw err;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}
