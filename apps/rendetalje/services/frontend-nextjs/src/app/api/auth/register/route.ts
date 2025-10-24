import { NextResponse } from 'next/server';
import { z } from 'zod';

// Registration request schema
const registerRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// Mock user database (replace with real database)
const mockUsers: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = registerRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Ugyldige registreringsoplysninger', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'En bruger med denne e-mail eksisterer allerede' },
        { status: 409 }
      );
    }

    // Create new user (in production, hash password and save to database)
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password, // In production, hash this with bcrypt
      role: 'customer', // Default role
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    // Return user data (excluding password)
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    return NextResponse.json({
      message: 'Konto oprettet succesfuldt',
      user: userResponse,
      token: 'mock-jwt-token', // Replace with real JWT
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Der opstod en fejl under registrering' },
      { status: 500 }
    );
  }
}
