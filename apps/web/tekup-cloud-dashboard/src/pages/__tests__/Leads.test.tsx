import { render, screen } from "@testing-library/react";
import { Leads } from "../Leads";

describe("Leads page", () => {
  it("renders lead table with sample data", () => {
    render(<Leads />);
    expect(screen.getByText(/Lead Management/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Lead/i)).toBeInTheDocument();
  });
});

