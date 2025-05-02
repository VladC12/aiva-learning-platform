import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const options = {};

/**
 * MongoDB Connection Manager - maintains a single connection across requests
 */
class MongoConnectionManager {
  private static instance: MongoConnectionManager;
  private client: MongoClient;
  private clientPromise: Promise<MongoClient>;
  private isConnecting: boolean = false;

  private constructor() {
    this.client = new MongoClient(uri, options);
    this.clientPromise = this.client.connect();
    this.isConnecting = true;

    // Add cleanup on app termination
    process.on('SIGINT', () => this.closeConnection());
    process.on('SIGTERM', () => this.closeConnection());
  }

  public static getInstance(): MongoConnectionManager {
    if (!MongoConnectionManager.instance) {
      MongoConnectionManager.instance = new MongoConnectionManager();
    }
    return MongoConnectionManager.instance;
  }

  public getClient(): Promise<MongoClient> {
    return this.clientPromise;
  }

  private async closeConnection(): Promise<void> {
    if (this.isConnecting) {
      const client = await this.clientPromise;
      await client.close();
      this.isConnecting = false;
      console.log('MongoDB connection closed');
    }
  }
}

// Export a singleton instance of the MongoDB client
const clientPromise: Promise<MongoClient> = MongoConnectionManager.getInstance().getClient();
export default clientPromise;