import pg from "pg";
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

// Initialize the raw PG connection
const db = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// Give that connection to Prisma!
const adapter = new PrismaPg(db);
const prisma = new PrismaClient({ adapter });

export { prisma };
export default db;
