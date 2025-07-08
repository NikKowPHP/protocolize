import { NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { validatePassword } from '@/lib/validation';
import { authRateLimiter } from '@/lib/rateLimiter';

export async function POST(request: Request) {
  // Get client IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(/, /)[0] : '127.0.0.1';

  // Apply rate limiting
  const limit = authRateLimiter(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          'Retry-After': limit.retryAfter!.toString()
        }
      }
    );
  }

  try {
    // Check if request body is valid JSON
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Invalid JSON format in request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.message,
          code: 'INVALID_PASSWORD'
        },
        { status: 400 }
      );
    }

    const { data, error } = await signUp(email, password);

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        {
          error: error.message,
          code: (error as any).code || 'REGISTRATION_ERROR'
        },
        { status: error.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Server error during registration:', error);
    return NextResponse.json(
      {
        error: message,
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}