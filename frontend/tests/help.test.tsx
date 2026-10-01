import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HelpPage from "@/app/help/page";

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  usePathname: () => "/help",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Help & Documentation Page Tests", () => {
  it("renders Help page title and initial documentation categories", () => {
    render(<HelpPage />);

    expect(screen.getByText("Help & Documentation Center")).toBeInTheDocument();
    expect(screen.getAllByText("1. Getting Started").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2. Data Ingestion & Profiling").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3. Dataset Preparation & Cleaning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("7. AI Analyst & Natural Language Q&A").length).toBeGreaterThan(0);
  });

  it("renders detailed pipeline and AI analyst documentation content", () => {
    render(<HelpPage />);

    expect(screen.getAllByText(/NVIDIA Nemotron/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Explain Visual/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/The 6-Step Workspace Pipeline/i)).toBeInTheDocument();
  });

  it("filters documentation topics when searching keywords", async () => {
    render(<HelpPage />);

    const searchInput = screen.getByPlaceholderText("Search documentation...");
    fireEvent.change(searchInput, { target: { value: "DuckDB" } });

    await waitFor(() => {
      expect(screen.getAllByText("5. Analytics & Visualization").length).toBeGreaterThan(0);
    });
  });

  it("renders AI safety, raw data immutability, and troubleshooting guidance", () => {
    render(<HelpPage />);

    expect(screen.getAllByText("8. AI Safety & Data Governance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10. Troubleshooting & FAQs").length).toBeGreaterThan(0);
  });
});
