"""create proctoring_events table and termination_reason column

Revision ID: c3d4e5f6a1b2
Revises: b2c3d4e5f6a1
Create Date: 2026-10-09 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a1b2'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create proctoring_events table and add termination_reason."""
    # 1. Add termination_reason column to interview_sessions if missing
    try:
        op.add_column('interview_sessions', sa.Column('termination_reason', sa.String(length=100), nullable=True))
    except Exception:
        pass

    # 2. Create proctoring_events table
    op.create_table(
        'proctoring_events',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('session_id', sa.String(), sa.ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_proctoring_events_session_id', 'proctoring_events', ['session_id'])
    op.create_index('ix_proctoring_events_event_type', 'proctoring_events', ['event_type'])
    op.create_index('ix_proctoring_events_recorded_at', 'proctoring_events', ['recorded_at'])


def downgrade() -> None:
    """Downgrade schema: drop proctoring_events table and termination_reason."""
    op.drop_index('ix_proctoring_events_recorded_at', table_name='proctoring_events')
    op.drop_index('ix_proctoring_events_event_type', table_name='proctoring_events')
    op.drop_index('ix_proctoring_events_session_id', table_name='proctoring_events')
    op.drop_table('proctoring_events')
    try:
        op.drop_column('interview_sessions', 'termination_reason')
    except Exception:
        pass
