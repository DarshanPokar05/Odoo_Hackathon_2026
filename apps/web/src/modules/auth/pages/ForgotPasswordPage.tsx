import React from 'react';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { useAuth } from '../hooks/useAuth';

export function ForgotPasswordPage() {
  const { forgotPassword, isForgotPasswordPending, forgotPasswordError, isForgotPasswordSuccess } = useAuth();

  const handleSubmit = (data: any) => {
    forgotPassword(data);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-6 bg-card/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <span className="text-primary font-bold text-lg">AF</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Forgot password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        <ForgotPasswordForm
          onSubmit={handleSubmit}
          isLoading={isForgotPasswordPending}
          errorMessage={forgotPasswordError ? forgotPasswordError.message : null}
          isSuccess={isForgotPasswordSuccess}
        />
      </div>
    </div>
  );
}
export default ForgotPasswordPage;
