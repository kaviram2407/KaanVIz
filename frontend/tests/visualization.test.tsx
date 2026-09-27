import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VisualizationView } from '@/components/visualization-view';
import { VisualizationChart } from '@/components/visualization-chart';
import { AnalyticsQueryResponse, VisualizationSpec } from '@/lib/api-client';

const mockQueryResponse: AnalyticsQueryResponse = {
  dataset_id: 'ds-viz-1',
  version_id: 'ver-viz-1',
  row_count: 2,
  columns: [
    { name: 'category', physical_type: 'VARCHAR', role: 'dimension' },
    { name: 'SUM(sales)', physical_type: 'FLOAT', role: 'measure', aggregation: 'SUM' },
  ],
  data: [
    { category: 'Electronics', 'SUM(sales)': 2500.0 },
    { category: 'Furniture', 'SUM(sales)': 2000.0 },
  ],
  execution_time_ms: 12.5,
};

const mockSpec: VisualizationSpec = {
  chart_type: 'bar',
  dimensions: [{ field: 'category' }],
  measures: [{ field: 'sales', aggregation: 'sum' }],
};

describe('Phase 6 — Frontend Visualization UI & Chart Tests', () => {
  it('renders visualization studio header and chart controls', () => {
    render(<VisualizationView />);

    expect(screen.getByText('Visualization & Analytics Studio')).toBeInTheDocument();
    expect(screen.getByText('Chart & Analytics Config')).toBeInTheDocument();
    expect(screen.getByText('Chart Type')).toBeInTheDocument();
    expect(screen.getByTestId('run-query-btn')).toBeInTheDocument();
  });

  it('renders KPI visualization single metric card', () => {
    const kpiSpec: VisualizationSpec = {
      chart_type: 'kpi',
      measures: [{ field: 'sales', aggregation: 'sum' }],
    };

    render(
      <VisualizationChart
        spec={kpiSpec}
        queryResponse={mockQueryResponse}
      />
    );

    expect(screen.getByText('SUM(sales)')).toBeInTheDocument();
  });

  it('renders aggregated data table visual', () => {
    const tableSpec: VisualizationSpec = {
      chart_type: 'table',
      dimensions: [{ field: 'category' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    };

    render(
      <VisualizationChart
        spec={tableSpec}
        queryResponse={mockQueryResponse}
      />
    );

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Furniture')).toBeInTheDocument();
  });

  it('renders query error alert when query fails', () => {
    render(
      <VisualizationChart
        spec={mockSpec}
        queryResponse={null}
        error="Field 'invalid_col' not found in schema"
      />
    );

    expect(screen.getByText('Visualization Query Error')).toBeInTheDocument();
    expect(screen.getByText("Field 'invalid_col' not found in schema")).toBeInTheDocument();
  });
});
