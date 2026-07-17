const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 5,
    });
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasProducts = collections.some(c => c.name === 'products');
    let count = 0;
    if (hasProducts) {
      count = await mongoose.connection.db.collection('products').countDocuments();
    }
    console.log('Connected to MongoDB host:', host);
    console.log('Database name:', dbName);
    console.log('Products collection exists:', hasProducts);
    console.log('Products count:', count);
  } catch (err) {
    console.error('Connection/query failed:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

run();
