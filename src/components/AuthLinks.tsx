'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import React from 'react';
import { useRouter } from 'next/navigation';

export function AuthLinks() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default form submission
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/'; // Redirect to home page after sign-out
      } else {
        // Handle sign-out error
        console.error('Sign-out failed:', response.statusText);
        // Optionally, display an error message to the user
      }
    } catch (error) {
      console.error('Error during sign-out:', error);
      // Optionally, display an error message to the user
    }
  };

  if (user) {
    return (
      <>
        <button
          onClick={handleSignOut}
          className="hover:underline bg-transparent border-none text-white cursor-pointer"
        >
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="hover:underline">
        Login
      </Link>
      <Link href="/signup" className="hover:underline">
        Sign Up
      </Link>
    </>
  );
}
