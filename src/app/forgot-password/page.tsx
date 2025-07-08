import React from 'react';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Reset Your Password</h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
