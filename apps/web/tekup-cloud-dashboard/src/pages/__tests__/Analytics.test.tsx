import { render, screen } from "@testing-library/react";
import { Analytics } from "../Analytics";

describe("Analytics page", () => {
  it("shows analytics headline and metric cards", () => {
    render(<Analytics />);
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Track performance metrics and business insights/i)
    ).toBeInTheDocument();
  });
});

