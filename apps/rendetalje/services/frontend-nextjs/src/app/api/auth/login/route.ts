import { NextResponse } from "next/server";
import { z } from "zod";

// Login request schema
const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Mock user database (replace with real database)
const mockUsers = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "owner@example.com",
    password: "securePassword123", // In production, this would be hashed
    name: "Test Owner",
    role: "owner",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "employee@example.com",
    password: "securePassword123",
    name: "Test Employee",
    role: "employee",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "customer@example.com",
    password: "securePassword123",
    name: "Test Customer",
    role: "customer",
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = loginRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Ugyldige loginoplysninger",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user (in production, use database and check hashed password)
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { message: "Forkert e-mail eller adgangskode" },
        { status: 401 }
      );
    }

    // In production, generate JWT token and set httpOnly cookie
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return NextResponse.json({
      message: "Login succesfuldt",
      user: userResponse,
      token: "mock-jwt-token", // Replace with real JWT
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Der opstod en fejl under login" },
      { status: 500 }
    );
  }
}
