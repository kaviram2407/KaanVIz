"""Phase 5 Data Modeling and Relationships tables

Revision ID: 004_phase5_modeling
Revises: 003_phase4_transformations
Create Date: 2026-09-27 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_phase5_modeling'
down_revision: Union[str, None] = '003_phase4_transformations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create data_models table
    op.create_table(
        'data_models',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False, server_default='Default Data Model'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Create model_datasets table
    op.create_table(
        'model_datasets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('model_id', sa.String(length=36), nullable=False),
        sa.Column('dataset_id', sa.String(length=36), nullable=False),
        sa.Column('dataset_version_id', sa.String(length=36), nullable=False),
        sa.Column('alias', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['model_id'], ['data_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Create relationships table
    op.create_table(
        'relationships',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('workspace_id', sa.String(length=36), nullable=False),
        sa.Column('model_id', sa.String(length=36), nullable=False),
        sa.Column('source_dataset_id', sa.String(length=36), nullable=False),
        sa.Column('source_dataset_version_id', sa.String(length=36), nullable=False),
        sa.Column('source_field', sa.String(length=255), nullable=False),
        sa.Column('target_dataset_id', sa.String(length=36), nullable=False),
        sa.Column('target_dataset_version_id', sa.String(length=36), nullable=False),
        sa.Column('target_field', sa.String(length=255), nullable=False),
        sa.Column('cardinality', sa.String(length=50), nullable=False, server_default='one_to_many'),
        sa.Column('relationship_type', sa.String(length=50), nullable=False, server_default='explicit'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='approved'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['model_id'], ['data_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_dataset_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_dataset_version_id'], ['dataset_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('relationships')
    op.drop_table('model_datasets')
    op.drop_table('data_models')
