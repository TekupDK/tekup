import { render, screen } from "@testing-library/react";
import { Integrations } from "../Integrations";

describe("Integrations page", () => {
  it("lists integrations and actions", () => {
    render(<Integrations />);
    expect(
      screen.getByRole("heading", { name: /Integrations/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Billy.dk/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Calendar/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Integration/i)).toBeInTheDocument();
  });
});
