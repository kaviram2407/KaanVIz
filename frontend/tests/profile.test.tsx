import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatasetProfileView } from '@/components/dataset-profile-view';
import { DatasetProfileResponse } from '@/lib/api-client';

const mockProfile: DatasetProfileResponse = {
  dataset_id: 'ds-100',
  workspace_id: 'default',
  version_id: 'ver-100',
  dataset_name: 'Sales Analytics 2026',
  summary: {
    id: 'prof-1',
    dataset_id: 'ds-100',
    dataset_version_id: 'ver-100',
    row_count: 500,
    column_count: 4,
    file_size_bytes: 12400,
    duplicate_rows: 2,
    missing_cells: 5,
    missing_percentage: 0.25,
    quality_score: 98.5,
    summary_metadata: {},
    status: 'completed',
    created_at: new Date().toISOString(),
  },
  columns: [
    {
      id: 'col-1',
      dataset_id: 'ds-100',
      dataset_version_id: 'ver-100',
      name: 'order_id',
      ordinal_position: 0,
      physical_type: 'INTEGER',
      semantic_type: 'Identifier',
      type_source: 'inferred',
      null_count: 0,
      null_percentage: 0.0,
      distinct_count: 500,
      is_unique: true,
      stats: { min: 1, max: 500, mean: 250.5 },
    },
    {
      id: 'col-2',
      dataset_id: 'ds-100',
      dataset_version_id: 'ver-100',
      name: 'revenue',
      ordinal_position: 1,
      physical_type: 'DECIMAL',
      semantic_type: 'Numeric',
      type_source: 'inferred',
      null_count: 5,
      null_percentage: 1.0,
      distinct_count: 420,
      is_unique: false,
      stats: { min: 10.5, max: 1500.0, mean: 350.25 },
    },
  ],
};

describe('Phase 3 — Frontend Dataset Profile UI Tests', () => {
  it('renders dataset summary metrics correctly', () => {
    render(<DatasetProfileView profileData={mockProfile} onBack={vi.fn()} />);

    expect(screen.getByText('Sales Analytics 2026')).toBeInTheDocument();
    expect(screen.getByText(/98\.5%/)).toBeInTheDocument();
    expect(screen.getAllByText('500').length).toBeGreaterThan(0); // Row count & distinct count
    expect(screen.getAllByText('4').length).toBeGreaterThan(0); // Column count
  });

  it('renders column profile items in table', () => {
    render(<DatasetProfileView profileData={mockProfile} onBack={vi.fn()} />);

    expect(screen.getByText('order_id')).toBeInTheDocument();
    expect(screen.getByText('INTEGER')).toBeInTheDocument();
    expect(screen.getByText('Identifier')).toBeInTheDocument();

    expect(screen.getByText('revenue')).toBeInTheDocument();
    expect(screen.getByText('DECIMAL')).toBeInTheDocument();
    expect(screen.getByText('Numeric')).toBeInTheDocument();
  });

  it('triggers onBack callback when Back button clicked', () => {
    const onBackMock = vi.fn();
    render(<DatasetProfileView profileData={mockProfile} onBack={onBackMock} />);

    const backBtn = screen.getByTestId('back-to-catalog-button');
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
