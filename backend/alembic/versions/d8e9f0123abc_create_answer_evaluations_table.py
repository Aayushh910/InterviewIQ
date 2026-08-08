"""create_answer_evaluations_table

Revision ID: d8e9f0123abc
Revises: c4e7f89012ab
Create Date: 2026-08-08 14:46:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e9f0123abc'
down_revision: Union[str, Sequence[str], None] = 'c4e7f89012ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'answer_evaluations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('answer_id', sa.String(), nullable=False),
        sa.Column('relevance_score', sa.Float(), nullable=False),
        sa.Column('correctness_score', sa.Float(), nullable=False),
        sa.Column('completeness_score', sa.Float(), nullable=False),
        sa.Column('clarity_score', sa.Float(), nullable=False),
        sa.Column('technical_depth_score', sa.Float(), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('strengths', sa.JSON(), nullable=False),
        sa.Column('improvements', sa.JSON(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('evaluator_provider', sa.String(length=50), nullable=False, server_default='heuristic'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['answer_id'], ['answers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('answer_id')
    )
    op.create_index(op.f('ix_answer_evaluations_answer_id'), 'answer_evaluations', ['answer_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_answer_evaluations_answer_id'), table_name='answer_evaluations')
    op.drop_table('answer_evaluations')
