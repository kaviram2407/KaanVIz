import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAnalystPanel } from '@/components/ai-analyst-panel';
import * as aiApi from '@/lib/ai-api';

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="mock-echarts">Mock ECharts Component</div>,
}));

vi.mock('@/lib/ai-api', async () => {

  const actual = await vi.importActual('@/lib/ai-api');
  return {
    ...actual,
    fetchAIStatus: vi.fn(),
    askAIQuestion: vi.fn(),
    generateAIVisualization: vi.fn(),
    explainAIVisual: vi.fn(),
    fetchAIInsights: vi.fn(),
    testAIConnection: vi.fn(),
    toggleAIStatus: vi.fn(),
  };
});

describe('Phase 8 — Frontend AI Analyst Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI disabled warning banner when AI_ENABLED is false', async () => {
    vi.mocked(aiApi.fetchAIStatus).mockResolvedValueOnce({
      enabled: false,
      provider: 'none',
      status: 'disabled',
      message: 'AI Analyst is disabled in configuration.',
    });

    render(<AIAnalystPanel datasetId="ds-1" />);

    await waitFor(() => {
      expect(screen.getByText(/AI Analyst is currently unavailable or disabled/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Disabled \/ Unconfigured/i)).toBeInTheDocument();
    });
  });

  it('renders active provider, model name, and toggle switch accessibility', async () => {
    vi.mocked(aiApi.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      provider: 'nvidia',
      model: 'nvidia/nemotron-3-super-120b-a12b',
      status: 'enabled',
      configured: true,
    });

    render(<AIAnalystPanel datasetId="ds-1" />);

    await waitFor(() => {
      expect(screen.getAllByText(/nvidia/i).length).toBeGreaterThan(0);
      expect(screen.getByText('nvidia/nemotron-3-super-120b-a12b')).toBeInTheDocument();
      const switchBtn = screen.getByRole('switch', { name: /Toggle AI Analyst Enabled State/i });
      expect(switchBtn).toBeInTheDocument();
      expect(switchBtn).toHaveAttribute('aria-checked', 'true');
    });

    // Verify secret key non-disclosure in DOM
    expect(document.body.innerHTML).not.toContain('nvapi-');
  });

  it('supports toggling AI status via toggleAIStatus API call', async () => {
    vi.mocked(aiApi.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      provider: 'nvidia',
      model: 'nvidia/nemotron-3-super-120b-a12b',
      status: 'enabled',
      configured: true,
    });

    vi.mocked(aiApi.toggleAIStatus).mockResolvedValueOnce({
      enabled: false,
      provider: 'nvidia',
      model: 'nvidia/nemotron-3-super-120b-a12b',
      status: 'disabled',
      configured: false,
    });

    render(<AIAnalystPanel datasetId="ds-1" />);

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    const switchBtn = screen.getByRole('switch');
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(aiApi.toggleAIStatus).toHaveBeenCalledWith(false);
    });
  });

  it('executes Test Connection and displays success feedback banner', async () => {
    vi.mocked(aiApi.fetchAIStatus).mockResolvedValue({
      enabled: true,
      provider: 'nvidia',
      model: 'nvidia/nemotron-3-super-120b-a12b',
      status: 'enabled',
      configured: true,
    });

    vi.mocked(aiApi.testAIConnection).mockResolvedValueOnce({
      success: true,
      provider: 'nvidia',
      model: 'nvidia/nemotron-3-super-120b-a12b',
      configured: true,
      message: 'Successfully connected to NVIDIA Nemotron API.',
    });

    render(<AIAnalystPanel datasetId="ds-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument();
    });

    const testBtn = screen.getByRole('button', { name: /Test Connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/Connected: NVIDIA Nemotron is available\./i)).toBeInTheDocument();
    });
  });

  it('renders AI active status and supports natural language question flow', async () => {
    vi.mocked(aiApi.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      provider: 'mock',
      status: 'enabled',
      message: 'AI Analyst is fully operational.',
    });

    vi.mocked(aiApi.askAIQuestion).mockResolvedValueOnce({
      question: 'What is total revenue by category?',
      query_intent: {
        intent: 'analytics_query',
        dimensions: [{ field: 'category' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
        filters: [],
      },
      analytics_result: {
        dataset_id: 'ds-1',
        version_id: 'v1',
        row_count: 2,
        columns: [
          { name: 'category', physical_type: 'VARCHAR', role: 'dimension' },
          { name: 'SUM(revenue)', physical_type: 'FLOAT', role: 'measure' },
        ],
        data: [
          { category: 'Electronics', 'SUM(revenue)': 1500 },
          { category: 'Furniture', 'SUM(revenue)': 800 },
        ],
        execution_time_ms: 5.2,
      },
      visual_suggestion: {
        chart_type: 'bar',
        title: 'Revenue by Category',
        dimensions: [{ field: 'category' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
      },
      summary_answer: 'Executed query on dataset. Returned 2 rows.',
    });

    render(<AIAnalystPanel datasetId="ds-1" />);

    await waitFor(() => {
      expect(screen.getByText(/AI Active \(mock\)/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/e\.g\. What is total revenue by category\?/i);
    fireEvent.change(input, { target: { value: 'What is total revenue by category?' } });

    const askBtn = screen.getByRole('button', { name: /Ask AI/i });
    fireEvent.click(askBtn);

    await waitFor(() => {
      expect(screen.getByText('Executed query on dataset. Returned 2 rows.')).toBeInTheDocument();
      expect(screen.getByText(/Approve/i)).toBeInTheDocument();
      expect(screen.getByText(/Reject/i)).toBeInTheDocument();
    });
  });

  it('handles user approval of AI visual suggestion', async () => {
    const mockOnApprove = vi.fn();

    vi.mocked(aiApi.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      provider: 'mock',
      status: 'enabled',
    });

    vi.mocked(aiApi.generateAIVisualization).mockResolvedValueOnce({
      suggestion: {
        chart_type: 'bar',
        title: 'Sales by Region',
        dimensions: [{ field: 'region' }],
        measures: [{ field: 'sales', aggregation: 'sum' }],
        explanation: 'Bar chart of sales grouped by region.',
      },
      is_valid: true,
      validation_issues: [],
    });

    render(<AIAnalystPanel datasetId="ds-1" onApproveVisual={mockOnApprove} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Prompt-to-Visual/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Prompt-to-Visual/i }));


    const input = screen.getByPlaceholderText(/e\.g\. Show sales by category as a bar chart/i);
    fireEvent.change(input, { target: { value: 'Show sales by region as a bar chart' } });

    const genBtn = screen.getByRole('button', { name: /Generate Chart/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getByText('Validated KaanViz Spec')).toBeInTheDocument();
      expect(screen.getByText('Sales by Region')).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /Approve & Apply/i });
    fireEvent.click(approveBtn);

    expect(mockOnApprove).toHaveBeenCalledWith({
      chart_type: 'bar',
      title: 'Sales by Region',
      dimensions: [{ field: 'region' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
      explanation: 'Bar chart of sales grouped by region.',
    });
  });

  it('renders structured AI insights', async () => {
    vi.mocked(aiApi.fetchAIStatus).mockResolvedValueOnce({
      enabled: true,
      provider: 'mock',
      status: 'enabled',
    });

    vi.mocked(aiApi.fetchAIInsights).mockResolvedValueOnce({
      dataset_id: 'ds-1',
      insights: [
        {
          type: 'trend',
          title: 'High Sales Growth',
          summary: 'Sales in North region increased by 25%.',
          evidence: ['North sales = $15,000', 'South sales = $12,000'],
          related_fields: ['region', 'sales'],
        },
      ],
    });

    render(<AIAnalystPanel datasetId="ds-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /AI Insights/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /AI Insights/i }));


    const genBtn = screen.getByRole('button', { name: /Generate Insights/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getByText('High Sales Growth')).toBeInTheDocument();
      expect(screen.getByText('Sales in North region increased by 25%.')).toBeInTheDocument();
      expect(screen.getByText('North sales = $15,000')).toBeInTheDocument();
    });
  });
});
