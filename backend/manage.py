#!/usr/bin/env python
"""
Management script for Cross-App Comparison Agent.

Usage:
    python manage.py make-admin <username_or_email>
    python manage.py create-admin <username> <email> <name> <password>
    python manage.py list-admins
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.database import SessionLocal, engine
from app.models import User
from app.services.auth import hash_password


def make_admin(username_or_email):
    """Promote an existing user to admin"""
    db = SessionLocal()
    try:
        user = db.scalar(
            select(User).where(
                (User.username == username_or_email) | (User.email == username_or_email)
            )
        )
        
        if not user:
            print(f"❌ User not found: {username_or_email}")
            return False
        
        if user.is_admin:
            print(f"ℹ️  User '{user.username}' is already an admin")
            return True
        
        user.is_admin = True
        db.commit()
        print(f"✅ User '{user.username}' ({user.email}) is now an admin")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        db.close()


def create_admin(username, email, name, password):
    """Create a new admin user"""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.scalar(
            select(User).where(
                (User.username == username) | (User.email == email)
            )
        )
        
        if existing:
            print(f"❌ User already exists: {username} or {email}")
            return False
        
        admin_user = User(
            username=username,
            email=email,
            name=name,
            password_hash=hash_password(password),
            is_admin=True,
            is_active=True,
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Admin user created successfully")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Name: {admin_user.name}")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        return False
    finally:
        db.close()


def list_admins():
    """List all admin users"""
    db = SessionLocal()
    try:
        admins = db.scalars(
            select(User).where(User.is_admin == True).order_by(User.created_at)
        ).all()
        
        if not admins:
            print("No admin users found")
            return
        
        print(f"\n📋 Admin Users ({len(admins)} total):\n")
        for admin in admins:
            print(f"  • {admin.username} ({admin.email})")
            print(f"    Name: {admin.name}")
            print(f"    Status: {'Active' if admin.is_active else 'Inactive'}")
            print(f"    Created: {admin.created_at}\n")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "make-admin" and len(sys.argv) >= 3:
        username_or_email = sys.argv[2]
        make_admin(username_or_email)
    elif command == "create-admin" and len(sys.argv) >= 6:
        username = sys.argv[2]
        email = sys.argv[3]
        name = sys.argv[4]
        password = sys.argv[5]
        create_admin(username, email, name, password)
    elif command == "list-admins":
        list_admins()
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
