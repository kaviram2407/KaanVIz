import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatasetPreparationView } from '@/components/dataset-preparation-view';
import { DatasetProfileResponse } from '@/lib/api-client';

const mockProfile: DatasetProfileResponse = {
  dataset_id: 'ds-prep-1',
  workspace_id: 'default',
  version_id: 'ver-100',
  dataset_name: 'Prep Test Dataset',
  summary: {
    id: 'prof-1',
    dataset_id: 'ds-prep-1',
    dataset_version_id: 'ver-100',
    row_count: 100,
    column_count: 3,
    file_size_bytes: 2048,
    duplicate_rows: 5,
    missing_cells: 10,
    missing_percentage: 3.33,
    quality_score: 95.0,
    summary_metadata: {},
    status: 'completed',
    created_at: new Date().toISOString(),
  },
  columns: [
    {
      id: 'c1',
      dataset_id: 'ds-prep-1',
      dataset_version_id: 'ver-100',
      name: 'cust_id',
      ordinal_position: 0,
      physical_type: 'INTEGER',
      semantic_type: 'Identifier',
      type_source: 'inferred',
      null_count: 0,
      null_percentage: 0.0,
      distinct_count: 100,
      is_unique: true,
      stats: {},
    },
    {
      id: 'c2',
      dataset_id: 'ds-prep-1',
      dataset_version_id: 'ver-100',
      name: 'city',
      ordinal_position: 1,
      physical_type: 'VARCHAR',
      semantic_type: 'Category',
      type_source: 'inferred',
      null_count: 10,
      null_percentage: 10.0,
      distinct_count: 15,
      is_unique: false,
      stats: {},
    },
  ],
};

describe('Phase 4 — Frontend Dataset Preparation UI Tests', () => {
  it('renders preparation workbench header and operation tabs', () => {
    render(<DatasetPreparationView profileData={mockProfile} />);

    expect(screen.getByText('Data Preparation & Cleaning Workbench')).toBeInTheDocument();
    expect(screen.getByText('Missing Values')).toBeInTheDocument();
    expect(screen.getByText('Duplicates')).toBeInTheDocument();
    expect(screen.getByText('Type Correction')).toBeInTheDocument();
  });

  it('queues an operation when Add Operation button is clicked', () => {
    render(<DatasetPreparationView profileData={mockProfile} />);

    const addBtn = screen.getByText('Add Operation to Plan');
    fireEvent.click(addBtn);

    expect(screen.getByText('fill_missing')).toBeInTheDocument();
  });
});
