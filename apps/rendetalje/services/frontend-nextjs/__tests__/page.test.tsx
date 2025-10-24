/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthProvider";
import HomePage from "@/app/page";

// Mock the auth context
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockValue = {
    user: {
      id: "1",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
    },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  };

  return <AuthProvider value={mockValue}>{children}</AuthProvider>;
};

describe("HomePage", () => {
  it("renders welcome message for authenticated user", () => {
    render(
      <MockAuthProvider>
        <HomePage />
      </MockAuthProvider>
    );

    expect(screen.getByText(/welcome back, john/i)).toBeInTheDocument();
  });

  it("renders dashboard sections", () => {
    render(
      <MockAuthProvider>
        <HomePage />
      </MockAuthProvider>
    );

    expect(screen.getByText(/recent jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
    expect(screen.getByText(/team members/i)).toBeInTheDocument();
  });

  it("renders navigation menu", () => {
    render(
      <MockAuthProvider>
        <HomePage />
      </MockAuthProvider>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
  });
});
