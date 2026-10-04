"""create final_evaluations table

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-10-04 16:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: create final_evaluations table."""
    op.create_table(
        'final_evaluations',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('session_id', sa.String(), sa.ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('interview_id', sa.String(), sa.ForeignKey('interviews.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('answer_score', sa.Float(), nullable=False),
        sa.Column('communication_score', sa.Float(), nullable=True),
        sa.Column('visual_score', sa.Float(), nullable=True),
        sa.Column('performance_category', sa.String(length=50), nullable=False),
        sa.Column('category_scores', sa.JSON(), nullable=False),
        sa.Column('applied_weights', sa.JSON(), nullable=False),
        sa.Column('evidence_coverage', sa.JSON(), nullable=False),
        sa.Column('evidence_reliability', sa.JSON(), nullable=False),
        sa.Column('per_question_breakdown', sa.JSON(), nullable=False),
        sa.Column('strengths', sa.JSON(), nullable=False),
        sa.Column('improvements', sa.JSON(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('scoring_version', sa.String(length=20), nullable=False, server_default='1.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_final_evaluations_session_id', 'final_evaluations', ['session_id'], unique=True)
    op.create_index('ix_final_evaluations_interview_id', 'final_evaluations', ['interview_id'])
    op.create_index('ix_final_evaluations_user_id', 'final_evaluations', ['user_id'])


def downgrade() -> None:
    """Downgrade schema: drop final_evaluations table."""
    op.drop_index('ix_final_evaluations_user_id', table_name='final_evaluations')
    op.drop_index('ix_final_evaluations_interview_id', table_name='final_evaluations')
    op.drop_index('ix_final_evaluations_session_id', table_name='final_evaluations')
    op.drop_table('final_evaluations')
