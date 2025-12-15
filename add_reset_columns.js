import db from "./db.js";

const alterTableSQL = `
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_password_expires BIGINT;
`;

async function updateDB() {
    try {
        await db.query(alterTableSQL);
        console.log("Users table altered: added reset columns.");
        process.exit(0);
    } catch (err) {
        console.error("Error altering users table:", err);
        process.exit(1);
    }
}

updateDB();
