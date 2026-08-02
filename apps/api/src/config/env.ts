import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || "5000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
};