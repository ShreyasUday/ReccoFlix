const db = require('./db.js');

async function runSchemaUpdate() {
    try {
        console.log("[DB] Checking schema for password reset columns...");

        // Add reset_password_token if not exists
        await db.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='users' AND column_name='reset_password_token') THEN
              ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);
              RAISE NOTICE 'Added reset_password_token column';
          END IF;
      END
      $$;
    `);

        // Add reset_password_expires if not exists
        await db.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='users' AND column_name='reset_password_expires') THEN
              ALTER TABLE users ADD COLUMN reset_password_expires BIGINT;
              RAISE NOTICE 'Added reset_password_expires column';
          END IF;
      END
      $$;
    `);

        console.log("[DB] Schema verification complete. Columns exist.");
        process.exit(0);
    } catch (err) {
        console.error("[DB] Migration failed:", err);
        process.exit(1);
    }
}

runSchemaUpdate();
