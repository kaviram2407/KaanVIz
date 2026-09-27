"""Phase 4 Preparation / Transformations table

Revision ID: 003_phase4_transformations
Revises: 002_phase3_profiling
Create Date: 2026-09-27 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_phase4_transformations'
down_revision: Union[str, None] = '002_phase3_profiling'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'transformations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('dataset_id', sa.String(length=36), nullable=False),
        sa.Column('source_version_id', sa.String(length=36), nullable=False),
        sa.Column('target_version_id', sa.String(length=36), nullable=False),
        sa.Column('operation_type', sa.String(length=100), nullable=False),
        sa.Column('operation_spec', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('execution_status', sa.String(length=50), nullable=False, server_default='completed'),
        sa.Column('execution_metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('transformations')
