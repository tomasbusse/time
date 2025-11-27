import { useState } from 'react';
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');

  const { signIn } = useAuthActions();
  const getAuthorizationUrl = useAction(api.calendar.getAuthorizationUrl);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      if (isSignUp) {
        formData.append("name", name);
        formData.append("flow", "signUp");
      } else {
        formData.append("flow", "signIn");
      }

      await signIn("password", formData);
    } catch (err: any) {
      console.error("Error with email/password auth:", err);
      setError(err.message || isSignUp ? "Failed to sign up" : "Failed to sign in");
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);

    try {
      // Use existing Calendar OAuth for general LifeHub authentication
      const authUrl = await getAuthorizationUrl({});
      // Modify URL to include state for general LifeHub auth
      const modifiedUrl = authUrl.replace('prompt=consent', 'prompt=consent&state=lifehub');
      window.location.href = modifiedUrl;
    } catch (err: any) {
      console.error("Error getting authorization URL:", err);
      setError(err.message || "Failed to initiate Google login");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-off-white p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-dark-blue">
            {isSignUp ? "Create Account" : "Welcome to LifeHub"}
          </CardTitle>
          <p className="text-gray">
            {isSignUp ? "Sign up to get started" : "Sign in to access your productivity workspace"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoggingIn}
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  minLength={8}
                />
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full"
              >
                {isLoggingIn ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isLoggingIn ? "Signing in..." : "Sign in with Google"}
            </Button>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            {/* Toggle Sign In/Sign Up */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sm text-custom-brown hover:underline"
                disabled={isLoggingIn}
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}