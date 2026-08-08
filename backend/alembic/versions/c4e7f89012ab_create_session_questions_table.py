"""create_session_questions_table

Revision ID: c4e7f89012ab
Revises: 3f503c0a79c8
Create Date: 2026-08-08 14:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e7f89012ab'
down_revision: Union[str, Sequence[str], None] = '3f503c0a79c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop foreign key constraint on answers.question_id to allow referencing both main & session questions
    op.drop_constraint('answers_question_id_fkey', 'answers', type_='foreignkey')

    op.create_table(
        'session_questions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('interview_id', sa.String(), nullable=False),
        sa.Column('parent_question_id', sa.String(), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=50), nullable=False, server_default='counter'),
        sa.Column('follow_up_depth', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('question_order', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['interview_id'], ['interviews.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_session_questions_interview_id'), 'session_questions', ['interview_id'], unique=False)
    op.create_index(op.f('ix_session_questions_session_id'), 'session_questions', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_session_questions_session_id'), table_name='session_questions')
    op.drop_index(op.f('ix_session_questions_interview_id'), table_name='session_questions')
    op.drop_table('session_questions')
    op.create_foreign_key('answers_question_id_fkey', 'answers', 'interview_questions', ['question_id'], ['id'], ondelete='CASCADE')
