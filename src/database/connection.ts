import { Pool } from "pg";
import { appConfig } from "../config";

export const databaseConnection = new Pool({
  connectionString: appConfig.databaseUrl,
});
