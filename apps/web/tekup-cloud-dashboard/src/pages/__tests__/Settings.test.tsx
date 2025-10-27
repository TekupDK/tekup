import { render, screen } from "@testing-library/react";
import { Settings } from "../Settings";

describe("Settings page", () => {
  it("renders profile settings and actions", () => {
    render(<Settings />);
    expect(
      screen.getByRole("heading", { name: /Settings/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Profile Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
  });
});
