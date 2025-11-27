import { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';

export default function OAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const getAccessToken = useAction(api.calendar.getAccessToken);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent StrictMode double-invocation from exchanging the same code twice
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const processedKey = 'oauth_code_processed';

    if (code && sessionStorage.getItem(processedKey) === code) {
      // Already processed this code; clean up and go home
      window.history.replaceState({}, '', '/');
      navigate('/');
      return;
    }

    const handleCallback = async () => {
      try {
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setError(`OAuth error: ${error}`);
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!code) {
          console.error('No authorization code found in callback');
          setError('No authorization code received');
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('Processing OAuth callback...');
        // Mark this code as processed before the exchange to avoid races in StrictMode
        sessionStorage.setItem(processedKey, code);

        // Exchange code for tokens and establish authentication
        const tokens = await getAccessToken({ code });
        // Persist tokens locally so Calendar can sync immediately
        if (tokens?.access_token) {
          localStorage.setItem('google_access_token', tokens.access_token);
        }
        if (tokens?.refresh_token) {
          localStorage.setItem('google_refresh_token', tokens.refresh_token);
        }
        if (tokens?.expiry_date) {
          localStorage.setItem('google_token_expires_at', tokens.expiry_date.toString());
        }

        console.log('Authentication successful, redirecting to dashboard');
        setStatus('success');

        // Wait a moment for the authentication state to be properly established
        setTimeout(() => {
          // Clean up URL parameters
          window.history.replaceState({}, '', '/');
          // Navigate to dashboard
          navigate('/');
        }, 1000);
      } catch (error: any) {
        console.error('OAuth callback error:', error);

        // Check if it's an invalid_grant error (single-use code already consumed)
        if (error.message?.includes('invalid_grant')) {
          console.log('OAuth code already used, redirecting to dashboard');
          setStatus('success');
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
            navigate('/');
          }, 1000);
          return;
        }

        setError(error.message || 'Authentication failed');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [getAccessToken, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-off-white">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-blue mx-auto mb-4"></div>
            <p className="text-gray">Completing sign in...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="rounded-full h-8 w-8 bg-green-500 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </div>
            <p className="text-green-600">Authentication successful! Redirecting...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="rounded-full h-8 w-8 bg-red-500 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            <p className="text-red-600">{error}</p>
            <p className="text-gray text-sm mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}