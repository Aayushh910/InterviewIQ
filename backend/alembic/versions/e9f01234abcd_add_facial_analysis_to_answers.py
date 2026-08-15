"""add facial_analysis to answers

Revision ID: e9f01234abcd
Revises: d8e9f0123abc
Create Date: 2026-08-15 11:27:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9f01234abcd'
down_revision: Union[str, Sequence[str], None] = 'd8e9f0123abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('answers', sa.Column('facial_analysis', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('answers', 'facial_analysis')
