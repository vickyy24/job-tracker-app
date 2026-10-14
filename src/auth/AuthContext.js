import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { registerAccount, resendVerification, restoreSession, setCsrfToken, signIn, signOut, verifyEmail } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('restoring');
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState('');

  const acceptSession = useCallback((session) => {
    setCsrfToken(session.csrfToken);
    setUser(session.user);
    setNotice('');
    setStatus('authenticated');
  }, []);

  const restore = useCallback(async () => {
    setStatus('restoring');
    setNotice('');
    try {
      const session = await restoreSession();
      if (session) acceptSession(session);
      else { setUser(null); setStatus('anonymous'); }
    } catch {
      setUser(null);
      setStatus('unavailable');
    }
  }, [acceptSession]);

  useEffect(() => { restore(); }, [restore]);

  useEffect(() => {
    const onExpired = () => {
      setCsrfToken('');
      setUser(null);
      setStatus('anonymous');
      setNotice('Your session expired. Please sign in again.');
      if (window.location.pathname !== '/login') window.history.replaceState({}, '', '/login');
    };
    window.addEventListener('jobtrack:session-expired', onExpired);
    return () => window.removeEventListener('jobtrack:session-expired', onExpired);
  }, []);

  const authenticate = useCallback(async (credentials, mode) => {
    if (mode === 'register') return registerAccount(credentials);
    const session = await signIn(credentials);
    acceptSession(session);
    window.history.replaceState({}, '', '/dashboard');
  }, [acceptSession]);

  const confirmEmail = useCallback((email, code) => verifyEmail({ email, code }), []);
  const sendVerificationAgain = useCallback((email) => resendVerification(email), []);

  const logout = useCallback(async () => {
    let error = null;
    try { await signOut(); }
    catch (requestError) { error = requestError; }
    setCsrfToken('');
    setUser(null);
    setStatus('anonymous');
    setNotice(error ? 'Could not reach the server to end this session. Check your connection and sign out again.' : 'You have been signed out.');
    window.history.replaceState({}, '', '/login');
  }, []);

  const value = useMemo(() => ({ status, user, notice, authenticate, confirmEmail, sendVerificationAgain, logout, retryRestore: restore }), [status, user, notice, authenticate, confirmEmail, sendVerificationAgain, logout, restore]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
