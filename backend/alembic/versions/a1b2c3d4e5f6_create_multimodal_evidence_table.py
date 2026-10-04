"""create multimodal_evidence table

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2026-10-04 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create multimodal_evidence table."""
    op.create_table(
        'multimodal_evidence',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('session_id', sa.String(), sa.ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_id', sa.String(), nullable=True),
        sa.Column('answer_id', sa.String(), sa.ForeignKey('answers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('evidence_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='available'),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('raw_evidence', sa.JSON(), nullable=True),
        sa.Column('derived_indicators', sa.JSON(), nullable=True),
        sa.Column('observations', sa.JSON(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_multimodal_evidence_session_id', 'multimodal_evidence', ['session_id'])
    op.create_index('ix_multimodal_evidence_question_id', 'multimodal_evidence', ['question_id'])
    op.create_index('ix_multimodal_evidence_answer_id', 'multimodal_evidence', ['answer_id'])
    op.create_index('ix_multimodal_evidence_evidence_type', 'multimodal_evidence', ['evidence_type'])
    op.create_index('ix_multimodal_evidence_recorded_at', 'multimodal_evidence', ['recorded_at'])


def downgrade() -> None:
    """Downgrade schema: drop multimodal_evidence table."""
    op.drop_index('ix_multimodal_evidence_recorded_at', table_name='multimodal_evidence')
    op.drop_index('ix_multimodal_evidence_evidence_type', table_name='multimodal_evidence')
    op.drop_index('ix_multimodal_evidence_answer_id', table_name='multimodal_evidence')
    op.drop_index('ix_multimodal_evidence_question_id', table_name='multimodal_evidence')
    op.drop_index('ix_multimodal_evidence_session_id', table_name='multimodal_evidence')
    op.drop_table('multimodal_evidence')
