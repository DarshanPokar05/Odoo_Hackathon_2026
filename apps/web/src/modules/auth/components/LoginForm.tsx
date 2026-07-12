import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { LoginSchema, LoginInput } from '../schemas/auth.schema';

interface LoginFormProps {
  onSubmit: (data: LoginInput) => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function LoginForm({ onSubmit, isLoading, errorMessage }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-2 duration-200">
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

      <div>
        <div className="flex justify-between items-center mb-1.5 ml-1">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/70">
            <Lock className="h-4.5 w-4.5" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            disabled={isLoading}
            className="block w-full pl-10 pr-10 py-2.5 bg-background border border-border/80 rounded-xl shadow-sm text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-destructive font-medium ml-1">{errors.password.message}</p>
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
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
