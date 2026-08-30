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
    with engine.begin() as connection:
        print("🔧 Running migrations...\n")
        
        # Migration 1: Add is_admin column to users table
        print("  1️⃣  Adding is_admin column to users table...")
        try:
            connection.execute(
                text("""
                    ALTER TABLE users
                    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
                """)
            )
            print("     ✅ is_admin column added\n")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("     ℹ️  is_admin column already exists\n")
            else:
                print(f"     ❌ Error: {e}\n")
                raise
        
        # Migration 2: Create audit_logs table
        print("  2️⃣  Creating audit_logs table...")
        try:
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
            print("     ✅ audit_logs table created\n")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("     ℹ️  audit_logs table already exists\n")
            else:
                print(f"     ❌ Error: {e}\n")
                raise
        
        # Migration 3: Create indexes for better query performance
        print("  3️⃣  Creating indexes for audit_logs...")
        try:
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
            print("     ✅ Indexes created\n")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("     ℹ️  Indexes already exist\n")
            else:
                print(f"     ⚠️  Warning: {e}\n")
        
        print("✅ Migration completed successfully!\n")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
