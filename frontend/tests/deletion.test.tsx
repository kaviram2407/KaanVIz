import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataPage from '@/app/data/page';
import { DatasetList } from '@/components/dataset-list';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual('@/lib/api-client');
  return {
    ...actual,
    fetchWorkspaceDatasets: vi.fn(),
    fetchDatasetProfile: vi.fn(),
    deleteDataset: vi.fn(),
    clearWorkspaceData: vi.fn(),
  };
});

const mockDatasets: apiClient.DatasetItem[] = [
  {
    id: 'ds-001',
    workspace_id: 'default',
    name: 'Sales Dataset',
    status: 'ready',
    original_filename: 'sales.csv',
    file_size_bytes: 4096,
    row_count: 50,
    column_count: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ds-002',
    workspace_id: 'default',
    name: 'Inventory Dataset',
    status: 'ready',
    original_filename: 'inventory.csv',
    file_size_bytes: 8192,
    row_count: 120,
    column_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('Dataset Deletion & Workspace Cleanup UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.fetchWorkspaceDatasets).mockResolvedValue(mockDatasets);
  });

  it('renders Delete button for dataset item in list', async () => {
    const onDeleteMock = vi.fn();
    render(<DatasetList datasets={mockDatasets} onDeleteDataset={onDeleteMock} />);

    const deleteBtn = screen.getByTestId('delete-dataset-btn-ds-001');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(onDeleteMock).toHaveBeenCalledWith(mockDatasets[0]);
  });

  it('opens confirmation modal detailing items when Delete button clicked', async () => {
    render(<DataPage />);

    await waitFor(() => {
      expect(screen.getByText('Sales Dataset')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-dataset-btn-ds-001');
    fireEvent.click(deleteBtn);

    const modal = screen.getByTestId('delete-dataset-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded raw file/i)).toBeInTheDocument();
    expect(screen.getByText(/Prepared\/processed artifacts/i)).toBeInTheDocument();
    expect(screen.getByText(/Data-model bindings\/relationships involving this dataset/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard items referencing this dataset/i)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
  });

  it('cancels deletion when Cancel clicked in single deletion modal', async () => {
    render(<DataPage />);

    await waitFor(() => {
      expect(screen.getByText('Sales Dataset')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-dataset-btn-ds-001'));
    expect(screen.getByTestId('delete-dataset-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-delete-dataset-btn'));
    expect(screen.queryByTestId('delete-dataset-modal')).not.toBeInTheDocument();
    expect(apiClient.deleteDataset).not.toHaveBeenCalled();
  });

  it('executes deleteDataset API on permanent confirmation and shows notification', async () => {
    vi.mocked(apiClient.deleteDataset).mockResolvedValueOnce({
      status: 'success',
      message: 'Dataset deleted',
    });

    render(<DataPage />);

    await waitFor(() => {
      expect(screen.getByText('Sales Dataset')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-dataset-btn-ds-001'));
    fireEvent.click(screen.getByTestId('confirm-delete-dataset-btn'));

    await waitFor(() => {
      expect(apiClient.deleteDataset).toHaveBeenCalledWith('ds-001', 'default');
      expect(screen.getByTestId('data-page-notification')).toBeInTheDocument();
      expect(screen.getByText(/Dataset 'Sales Dataset' and all associated artifacts permanently deleted/i)).toBeInTheDocument();
    });
  });

  it('opens Clear Workspace Data modal and requires strict CLEAR confirmation text', async () => {
    render(<DataPage />);

    await waitFor(() => {
      expect(screen.getByText('Sales Dataset')).toBeInTheDocument();
    });

    const clearTriggerBtn = screen.getByTestId('clear-workspace-data-trigger-btn');
    fireEvent.click(clearTriggerBtn);

    const modal = screen.getByTestId('clear-workspace-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/permanently delete ALL datasets/i);



    const confirmBtn = screen.getByTestId('confirm-clear-workspace-btn');
    expect(confirmBtn).toBeDisabled();

    // Type incorrect confirmation text
    const input = screen.getByTestId('clear-workspace-input');
    fireEvent.change(input, { target: { value: 'clear' } }); // lowercase
    expect(confirmBtn).toBeDisabled();

    // Type exact uppercase "CLEAR"
    fireEvent.change(input, { target: { value: 'CLEAR' } });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('executes clearWorkspaceData API on confirmation and resets catalog state', async () => {
    vi.mocked(apiClient.clearWorkspaceData).mockResolvedValueOnce({
      status: 'success',
      message: 'Workspace cleared',
    });

    render(<DataPage />);

    fireEvent.click(screen.getByTestId('clear-workspace-data-trigger-btn'));

    const input = screen.getByTestId('clear-workspace-input');
    fireEvent.change(input, { target: { value: 'CLEAR' } });

    // Mock empty datasets for reload
    vi.mocked(apiClient.fetchWorkspaceDatasets).mockResolvedValue([]);

    fireEvent.click(screen.getByTestId('confirm-clear-workspace-btn'));

    await waitFor(() => {
      expect(apiClient.clearWorkspaceData).toHaveBeenCalledWith('CLEAR', 'default');
      expect(screen.getByTestId('data-page-notification')).toBeInTheDocument();
      expect(screen.getByText(/All workspace datasets and associated artifacts permanently cleared/i)).toBeInTheDocument();
    });
  });
});
