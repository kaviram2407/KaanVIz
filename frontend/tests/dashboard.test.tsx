import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardBuilderView } from '@/components/dashboard-builder-view';
import { DashboardItemWidget } from '@/components/dashboard-item-widget';
import { DashboardAuthoringPanel } from '@/components/dashboard-authoring-panel';
import { DashboardItemResponse } from '@/lib/api-client';

const mockWidget: DashboardItemResponse = {
  id: 'item-101',
  dashboard_id: 'dash-1',
  title: 'Category Revenue',
  dataset_id: 'ds-1',
  visualization_spec: {
    chart_type: 'bar',
    dimensions: [{ field: 'category' }],
    measures: [{ field: 'sales', aggregation: 'sum' }],
  },
  layout: { x: 0, y: 0, w: 6, h: 4 },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Phase 7 — Frontend Dashboard Builder Tests', () => {
  it('renders dashboard studio header, selector, and mode toggles', () => {
    render(<DashboardBuilderView />);

    expect(screen.getByText('Interactive Dashboard Studio')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-selector')).toBeInTheDocument();
    expect(screen.getByText('View Mode')).toBeInTheDocument();
    expect(screen.getByText('Edit Mode')).toBeInTheDocument();
  });

  it('renders dashboard widget card with title and filter badge support', () => {
    render(
      <DashboardItemWidget
        item={mockWidget}
        activeFilters={{ category: 'Electronics' }}
        isEditing={false}
      />
    );

    expect(screen.getByText('Category Revenue')).toBeInTheDocument();
    expect(screen.getByText('Filtered')).toBeInTheDocument();
  });

  it('toggles to edit mode and displays authoring panel and edit controls', () => {
    render(<DashboardBuilderView />);

    const editModeBtn = screen.getByRole('button', { name: /Edit Mode/i });
    fireEvent.click(editModeBtn);

    expect(screen.getByText('Add Visualization')).toBeInTheDocument();
    expect(screen.getByText('Save Layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-authoring-panel')).toBeInTheDocument();
    expect(screen.getByText('Visual Authoring Studio')).toBeInTheDocument();
  });

  it('renders authoring panel visual gallery, data tree, and simple measure format options', () => {
    const mockOnAddVisual = vi.fn();

    render(
      <DashboardAuthoringPanel
        isOpen={true}
        onTogglePanel={vi.fn()}
        selectedWidget={mockWidget}
        datasets={[{ id: 'ds-1', name: 'Sales Dataset', workspace_id: 'default' } as any]}
        selectedDatasetId="ds-1"
        onSelectDatasetId={vi.fn()}
        datasetProfile={{
          dataset_id: 'ds-1',
          version_id: 'v1',
          columns: [
            { name: 'category', physical_type: 'VARCHAR', null_count: 0, distinct_count: 5 },
            { name: 'revenue', physical_type: 'DECIMAL', null_count: 0, distinct_count: 100 },
          ] as any,
        } as any}
        onAddVisualType={mockOnAddVisual}
        onUpdateWidgetConfig={vi.fn()}
        onDeleteWidget={vi.fn()}
      />
    );

    expect(screen.getByTestId('dashboard-authoring-panel')).toBeInTheDocument();
    expect(screen.getByTestId('add-visual-bar')).toBeInTheDocument();
    expect(screen.getByTestId('add-visual-kpi')).toBeInTheDocument();

    // Click Visual Type
    fireEvent.click(screen.getByTestId('add-visual-kpi'));
    expect(mockOnAddVisual).toHaveBeenCalledWith('kpi');

    // Switch to Data tab
    fireEvent.click(screen.getByTestId('tab-data'));
    expect(screen.getByTestId('field-item-category')).toBeInTheDocument();
    expect(screen.getByTestId('field-item-revenue')).toBeInTheDocument();

    // Switch to Build tab
    fireEvent.click(screen.getByTestId('tab-build'));
    expect(screen.getByTestId('config-title-input')).toBeInTheDocument();
  });
});
