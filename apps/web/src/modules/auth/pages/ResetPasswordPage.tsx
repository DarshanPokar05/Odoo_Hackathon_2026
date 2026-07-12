import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isResetPasswordPending, resetPasswordError, isResetPasswordSuccess } = useAuth();

  const handleSubmit = (data: any) => {
    if (token) {
      resetPassword({ ...data, token });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-6 bg-card/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <span className="text-primary font-bold text-lg">AF</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reset password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below to secure your account
          </p>
        </div>

        {!token ? (
          <div className="space-y-4 text-center">
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium flex items-center justify-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              Invalid or missing password reset token.
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
            >
              Request a new reset link
            </Link>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <ResetPasswordForm
            onSubmit={handleSubmit}
            isLoading={isResetPasswordPending}
            errorMessage={resetPasswordError ? resetPasswordError.message : null}
            isSuccess={isResetPasswordSuccess}
          />
        )}
      </div>
    </div>
  );
}
export default ResetPasswordPage;
