import { render, screen } from "@testing-library/react";
import { Agents } from "../Agents";

describe("Agents page", () => {
  it("shows agent cards and tasks", () => {
    render(<Agents />);
    expect(screen.getByText(/AI Agent Monitoring/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead Capture Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Send follow-up email campaign/i)).toBeInTheDocument();
  });
});

