import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatasetUploader } from '@/components/dataset-uploader';
import { DatasetList } from '@/components/dataset-list';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual('@/lib/api-client');
  return {
    ...actual,
    uploadDataset: vi.fn(),
    fetchWorkspaceDatasets: vi.fn(),
  };
});

describe('Phase 2 — Frontend Ingestion UI Tests', () => {
  it('renders upload control dropzone', () => {
    render(<DatasetUploader />);
    expect(screen.getByText(/Choose a CSV file or drag & drop/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports standard CSV files up to 50MB/i)).toBeInTheDocument();
  });

  it('shows error state when invalid non-CSV file selected', async () => {
    render(<DatasetUploader />);
    const fileInput = screen.getByTestId('file-input');

    const file = new File(['binary content'], 'document.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('upload-error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid file format/i)).toBeInTheDocument();
    });
  });

  it('allows file selection and triggers upload API', async () => {
    const mockResponse: apiClient.DatasetUploadResponse = {
      dataset_id: 'ds-123',
      workspace_id: 'default',
      data_source_id: 'src-123',
      version_id: 'ver-1',
      name: 'Test Sales',
      original_filename: 'sales.csv',
      file_size_bytes: 1024,
      row_count: 10,
      column_count: 5,
      status: 'ready',
      created_at: new Date().toISOString(),
    };

    vi.mocked(apiClient.uploadDataset).mockResolvedValueOnce(mockResponse);

    render(<DatasetUploader />);
    const fileInput = screen.getByTestId('file-input');

    const file = new File(['id,val\n1,a\n'], 'sales.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('sales.csv')).toBeInTheDocument();
    const uploadBtn = screen.getByTestId('upload-button');
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(apiClient.uploadDataset).toHaveBeenCalledWith(file);
      expect(screen.getByTestId('upload-success-card')).toBeInTheDocument();
      expect(screen.getByText('Dataset Registered Successfully')).toBeInTheDocument();
    });
  });

  it('renders empty dataset list state', () => {
    render(<DatasetList datasets={[]} />);
    expect(screen.getByText('No datasets registered yet')).toBeInTheDocument();
  });

  it('renders dataset list with registered dataset item', () => {
    const mockDatasets: apiClient.DatasetItem[] = [
      {
        id: 'ds-001',
        workspace_id: 'default',
        name: 'Sales Data 2026',
        status: 'ready',
        original_filename: 'sales_2026.csv',
        file_size_bytes: 2048,
        row_count: 100,
        column_count: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(<DatasetList datasets={mockDatasets} />);
    expect(screen.getByText('Sales Data 2026')).toBeInTheDocument();
    expect(screen.getByText(/sales_2026.csv/i)).toBeInTheDocument();
    expect(screen.getByText(/100 rows × 8 cols/i)).toBeInTheDocument();
  });
});
