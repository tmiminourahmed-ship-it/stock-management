const mongoose = require('mongoose');

// Disable buffering so queries fail instantly with a clear error if DB is disconnected
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'Debou',
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Base de données: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`❌ Connection MongoDB échouée: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;
