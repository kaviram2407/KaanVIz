import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataModelingView } from '@/components/data-modeling-view';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<typeof apiClient>('@/lib/api-client');
  return {
    ...actual,
    fetchWorkspaceDataModel: vi.fn(),
    fetchWorkspaceDatasets: vi.fn(),
    fetchDatasetProfile: vi.fn(),
    validateRelationship: vi.fn(),
    createRelationship: vi.fn(),
    deleteRelationship: vi.fn(),
    bindDatasetToModel: vi.fn(),
  };
});

describe('Phase 5 — Frontend Data Modeling UI Tests', () => {
  const mockModel: apiClient.DataModelDetailsResponse = {
    id: 'model-123',
    workspace_id: 'default',
    name: 'Default Model',
    status: 'active',
    datasets: [
      {
        id: 'mds-1',
        model_id: 'model-123',
        dataset_id: 'ds-orders',
        dataset_version_id: 'ver-1',
        dataset_name: 'Orders',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'mds-2',
        model_id: 'model-123',
        dataset_id: 'ds-customers',
        dataset_version_id: 'ver-2',
        dataset_name: 'Customers',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ],
    relationships: [
      {
        id: 'rel-1',
        model_id: 'model-123',
        source_dataset_id: 'ds-orders',
        source_dataset_version_id: 'ver-1',
        source_field: 'cust_id',
        target_dataset_id: 'ds-customers',
        target_dataset_version_id: 'ver-2',
        target_field: 'cust_id',
        cardinality: 'many_to_one',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockDatasets: apiClient.DatasetItem[] = [
    {
      id: 'ds-orders',
      workspace_id: 'default',
      name: 'Orders',
      status: 'ready',
      original_filename: 'orders.csv',
      file_size_bytes: 1024,
      row_count: 50,
      column_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'ds-customers',
      workspace_id: 'default',
      name: 'Customers',
      status: 'ready',
      original_filename: 'customers.csv',
      file_size_bytes: 512,
      row_count: 10,
      column_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('renders data modeling header, model stats, and relationship table', async () => {
    vi.mocked(apiClient.fetchWorkspaceDataModel).mockResolvedValue(mockModel);
    vi.mocked(apiClient.fetchWorkspaceDatasets).mockResolvedValue(mockDatasets);
    vi.mocked(apiClient.fetchDatasetProfile).mockResolvedValue({
      dataset_id: 'ds-orders',
      workspace_id: 'default',
      version_id: 'ver-1',
      dataset_name: 'Orders',
      summary: {} as any,
      columns: [
        {
          id: 'c1',
          dataset_id: 'ds-orders',
          dataset_version_id: 'ver-1',
          name: 'cust_id',
          ordinal_position: 0,
          physical_type: 'INTEGER',
          semantic_type: 'Identifier',
          type_source: 'inferred',
          null_count: 0,
          null_percentage: 0,
          distinct_count: 10,
          is_unique: false,
          stats: {},
        },
      ],
    });

    render(<DataModelingView workspaceId="default" />);

    expect(screen.getByText('Loading Data Model...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Data Modeling & Relationships')).toBeInTheDocument();
    });

    expect(screen.getByText('model-123')).toBeInTheDocument();
    expect(screen.getByText('Create Explicit Relationship')).toBeInTheDocument();
    expect(screen.getAllByText('.cust_id').length).toBeGreaterThan(0);
  });
});
