// connect.js
import mongoose from 'mongoose';
import { config } from 'dotenv';
import colors from 'colors';

config();

const uri = process.env.MONGO_TOKEN;

if (!uri) {
  console.error('System'.red, '>>'.blue, 'MongoDB URI is not set in the environment variables!'.red);
  process.exit(1); // Exit the process if the URI is missing
}

export const connectToDb = async (retryCount = 3, retryDelay = 5000) => {
  let attempt = 0;

  while (attempt < retryCount) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000, // Time to wait for the server to respond
      });


      console.log('System'.cyan, '>>'.blue, 'Successfully connected to MongoDB'.green);
      setupConnectionEventHandlers();
      return;
    } catch (error) {
      attempt++;
      console.error(`Connection attempt ${attempt} failed:`, error.message.red);
      if (attempt < retryCount) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`.yellow);
        await new Promise(res => setTimeout(res, retryDelay));
      } else {
        console.error('System'.red, '>>'.blue, 'All connection attempts to MongoDB failed.'.red);
        throw error; // Rethrow error after exhausting retries
      }
    }
  }
};

export const getDb = () => mongoose.connection;

export const closeDb = async () => {
  try {
    await mongoose.connection.close();
    console.log('System'.cyan, '>>'.blue, 'Successfully closed MongoDB connection'.green);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message.red);
  }
};

// Internal function to handle connection events
const setupConnectionEventHandlers = () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established.'.green);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection lost.'.yellow);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB connection reestablished.'.cyan);
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message.red);
  });

  process.on('SIGINT', async () => {
    await closeDb();
    console.log('System'.cyan, '>>'.blue, 'Application terminated, MongoDB connection closed.'.green);
    process.exit(0);
  });
};
