import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { appConfig } from "./config";
import { connectDatabase } from "./database";
import apiRoutes from "./apiRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

connectDatabase();

app.use("/api/v1", apiRoutes)

app.use(errorHandler)

app.listen(appConfig.port, () => {
  console.log(`Server is running on port ${appConfig.port}`);
});
