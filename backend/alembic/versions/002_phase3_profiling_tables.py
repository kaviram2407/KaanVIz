"""Phase 3 Profiling metadata tables

Revision ID: 002_phase3_profiling
Revises: 001_phase2_ingestion
Create Date: 2026-09-27 11:21:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_phase3_profiling'
down_revision: Union[str, None] = '001_phase2_ingestion'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create dataset_profiles table
    op.create_table(
        'dataset_profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('dataset_id', sa.String(length=36), nullable=False),
        sa.Column('dataset_version_id', sa.String(length=36), nullable=False),
        sa.Column('row_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('column_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('duplicate_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('missing_cells', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('missing_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('quality_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('summary_metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='completed'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Create dataset_columns table
    op.create_table(
        'dataset_columns',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('dataset_id', sa.String(length=36), nullable=False),
        sa.Column('dataset_version_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('ordinal_position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('physical_type', sa.String(length=50), nullable=False, server_default='VARCHAR'),
        sa.Column('semantic_type', sa.String(length=50), nullable=False, server_default='Text'),
        sa.Column('type_source', sa.String(length=50), nullable=False, server_default='inferred'),
        sa.Column('null_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('null_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('distinct_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_unique', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('stats', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('dataset_columns')
    op.drop_table('dataset_profiles')
