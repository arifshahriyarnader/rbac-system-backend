import { databaseConnection } from './connection';

export const connectDatabase=async() => {
    try {
    await databaseConnection.query("SELECT 1");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}