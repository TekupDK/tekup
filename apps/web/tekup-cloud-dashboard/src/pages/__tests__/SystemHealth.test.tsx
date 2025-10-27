import { render, screen } from "@testing-library/react";
import { SystemHealth } from "../SystemHealth";

describe("SystemHealth page", () => {
  it("renders service overview table", () => {
    render(<SystemHealth />);
    expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    expect(screen.getByText(/API Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Errors \(24h\)/i)).toBeInTheDocument();
  });
});

