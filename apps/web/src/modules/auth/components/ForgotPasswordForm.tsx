import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { ForgotPasswordSchema, ForgotPasswordInput } from '../schemas/auth.schema';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordInput) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
}

export function ForgotPasswordForm({ onSubmit, isLoading, errorMessage, isSuccess }: ForgotPasswordFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center">
          <Mail className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We have sent a password reset link to your email address if it exists in our system.
          </p>
        </div>
        <div className="pt-4">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/70">
            <Mail className="h-4.5 w-4.5" />
          </div>
          <input
            {...register('email')}
            type="email"
            placeholder="name@company.com"
            disabled={isLoading}
            className="block w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl shadow-sm text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-destructive font-medium ml-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Sending link...
          </>
        ) : (
          'Send reset link'
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to login
        </Link>
      </div>
    </form>
  );
}
