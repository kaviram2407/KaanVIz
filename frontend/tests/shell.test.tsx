import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '@/components/shell/header';
import { Nav } from '@/components/shell/nav';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('KaanViz Base Shell Component Tests', () => {
  it('renders application branding header', () => {
    render(<Header />);
    expect(screen.getByText('KaanViz')).toBeInTheDocument();
    expect(screen.getByText('See Beyond Data')).toBeInTheDocument();
  });

  it('renders primary navigation items matching IA', () => {
    render(<Nav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Prepare')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Visualize')).toBeInTheDocument();
    expect(screen.getByText('Dashboards')).toBeInTheDocument();
    expect(screen.getByText('AI Analyst')).toBeInTheDocument();
  });
});
