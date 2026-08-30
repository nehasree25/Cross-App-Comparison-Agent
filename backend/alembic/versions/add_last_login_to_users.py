"""Add last_login field to users table

Revision ID: 003_add_last_login
Revises: 002_add_is_admin_to_users
Create Date: 2026-08-30 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_last_login'
down_revision = '002_add_is_admin_to_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add last_login column to users table
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    # Add index on last_login for efficient queries
    op.create_index('ix_users_last_login', 'users', ['last_login'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_users_last_login', table_name='users')
    # Drop column
    op.drop_column('users', 'last_login')
