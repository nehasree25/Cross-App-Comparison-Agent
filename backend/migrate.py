#!/usr/bin/env python
"""
Database migration script to add is_admin column and create audit_logs table.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.database import engine

def migrate():
    """Run all necessary migrations"""
    print("🔧 Running migrations...\n")
    
    # Migration 1: Add is_admin column to users table
    print("  1️⃣  Adding is_admin column to users table...")
    try:
        with engine.connect() as connection:
            connection.execute(
                text("""
                    ALTER TABLE users
                    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
                """)
            )
            connection.commit()
        print("     ✅ is_admin column added\n")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("     ℹ️  is_admin column already exists\n")
        else:
            print(f"     ⚠️  {e}\n")
    
    # Migration 2: Create audit_logs table
    print("  2️⃣  Creating audit_logs table...")
    try:
        with engine.connect() as connection:
            connection.execute(
                text("""
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        action VARCHAR(50) NOT NULL,
                        description VARCHAR(255) NOT NULL,
                        resource_type VARCHAR(50),
                        resource_id VARCHAR(100),
                        ip_address VARCHAR(45),
                        user_agent TEXT,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                """)
            )
            connection.commit()
        print("     ✅ audit_logs table created\n")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("     ℹ️  audit_logs table already exists\n")
        else:
            print(f"     ⚠️  {e}\n")
    
    # Migration 3: Create indexes for better query performance
    print("  3️⃣  Creating indexes for audit_logs...")
    try:
        with engine.connect() as connection:
            connection.execute(
                text("""
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
                    ON audit_logs(user_id)
                """)
            )
            connection.execute(
                text("""
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
                    ON audit_logs(action)
                """)
            )
            connection.execute(
                text("""
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
                    ON audit_logs(created_at)
                """)
            )
            connection.commit()
        print("     ✅ Indexes created\n")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("     ℹ️  Indexes already exist\n")
        else:
            print(f"     ⚠️  Warning: {e}\n")
    
    # Migration 4: Add last_login column to users table
    print("  4️⃣  Adding last_login column to users table...")
    try:
        with engine.connect() as connection:
            connection.execute(
                text("""
                    ALTER TABLE users
                    ADD COLUMN last_login TIMESTAMP WITH TIME ZONE
                """)
            )
            connection.commit()
        print("     ✅ last_login column added\n")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("     ℹ️  last_login column already exists\n")
        else:
            print(f"     ⚠️  {e}\n")
    
    # Migration 5: Create index on last_login for efficient queries
    print("  5️⃣  Creating index on last_login column...")
    try:
        with engine.connect() as connection:
            connection.execute(
                text("""
                    CREATE INDEX IF NOT EXISTS idx_users_last_login 
                    ON users(last_login)
                """)
            )
            connection.commit()
        print("     ✅ Index on last_login created\n")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("     ℹ️  Index already exists\n")
        else:
            print(f"     ⚠️  Warning: {e}\n")
    
    print("✅ Migration completed successfully!\n")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
