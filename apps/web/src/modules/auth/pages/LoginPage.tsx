import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (data: any) => {
    login(data);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-6 bg-card/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-xl transition-all duration-300">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <span className="text-primary font-bold text-lg">AF</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoggingIn}
          errorMessage={loginError ? loginError.message : null}
        />
      </div>
    </div>
  );
}
export default LoginPage;
