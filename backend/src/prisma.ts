import { config } from "dotenv";
// Load environment variables immediately before anything else
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env file");
}

// Initialize the standard Postgres connection pool
// Neon requires SSL, so we explicitly enable it here
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon's secure serverless connections
  },
});

// Attach it to Prisma's Postgres adapter
const adapter = new PrismaPg(pool);

// Export the customized Prisma client
export const prisma = new PrismaClient({ adapter });
