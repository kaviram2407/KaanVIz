import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SettingsPage from "@/app/settings/page";

// Mock API modules
vi.mock("@/lib/ai-api", () => ({
  fetchAIStatus: vi.fn().mockResolvedValue({
    enabled: true,
    provider: "nvidia",
    status: "enabled",
    message: "AI Analyst is fully operational.",
    model: "nvidia/nemotron-3-super-120b-a12b",
    configured: true,
  }),
  toggleAIStatus: vi.fn().mockResolvedValue({
    enabled: false,
    provider: "nvidia",
    status: "disabled",
    message: "AI Analyst features disabled.",
    model: "nvidia/nemotron-3-super-120b-a12b",
    configured: true,
  }),
  testAIConnection: vi.fn().mockResolvedValue({
    success: true,
    provider: "nvidia",
    model: "nvidia/nemotron-3-super-120b-a12b",
    configured: true,
    message: "Successfully connected to NVIDIA Nemotron API endpoint.",
  }),
}));

vi.mock("@/lib/api-client", () => ({
  fetchBackendHealth: vi.fn().mockResolvedValue({
    status: "healthy",
    version: "1.0.0",
    environment: "production",
    database: { status: "healthy" },
    redis: { status: "healthy" },
    storage: { status: "healthy" },
    ai: { status: "healthy" },
  }),
  fetchWorkspaceDatasets: vi.fn().mockResolvedValue([
    { id: "ds-1", workspace_id: "default", name: "test.csv", status: "ready", original_filename: "test.csv", file_size_bytes: 100, created_at: "", updated_at: "" },
  ]),
  fetchWorkspaceDashboards: vi.fn().mockResolvedValue([
    { id: "dash-1", workspace_id: "default", title: "Executive Overview", layout: [], created_at: "", updated_at: "" },
  ]),
}));

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Settings Page Tests", () => {
  it("renders Settings page title, AI status, provider, and model information", async () => {
    render(<SettingsPage />);

    expect(screen.getByText("Settings & Preferences")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("ai-status-label")).toHaveTextContent("Enabled");
      expect(screen.getByTestId("ai-provider-info")).toHaveTextContent(/nvidia/i);
      expect(screen.getByTestId("ai-model-info")).toHaveTextContent("nvidia/nemotron-3-super-120b-a12b");
    });
  });

  it("never renders raw secret API keys in the DOM", async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("api-key-status")).toHaveTextContent("••••••••••••••••");
    });

    const pageContent = document.body.innerHTML;
    expect(pageContent).not.toContain("nvapi-");
    expect(pageContent).not.toContain("NVIDIA_API_KEY=");
  });

  it("supports toggling AI status using existing toggleAIStatus API", async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-status-label")).toHaveTextContent("Enabled");
    });

    const toggleBtn = screen.getByTestId("ai-status-toggle");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText("AI Analyst successfully disabled.")).toBeInTheDocument();
    });
  });

  it("executes Test Connection using existing testAIConnection API and renders result state", async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("test-connection-btn")).not.toBeDisabled();
    });

    const testBtn = screen.getByTestId("test-connection-btn");
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/Connection test successful/i)).toBeInTheDocument();
    });
  });

  it("renders workspace telemetry, datasets count, and privacy governance sections", async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Workspace System Telemetry")).toBeInTheDocument();
      expect(screen.getByText("Data Architecture & Privacy Governance")).toBeInTheDocument();
      expect(screen.getByText("Raw Data Immutability")).toBeInTheDocument();
      expect(screen.getByText("AI Optionality Principle")).toBeInTheDocument();
    });
  });
});
