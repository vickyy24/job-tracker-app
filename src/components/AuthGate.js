import { useState } from 'react';
import { login } from '../services/applicationApi';

export default function AuthGate({ checking, onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(password);
      setPassword('');
      onAuthenticated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-screen"><section className="auth-card" aria-labelledby="auth-title">
    <span className="auth-brand-mark" aria-hidden="true">J</span>
    <p className="eyebrow">PRIVATE WORKSPACE</p>
    <h1 id="auth-title">Sign in to Jobtrack</h1>
    <p className="auth-description">Enter your workspace password to view your job applications.</p>
    {checking ? <p className="auth-status" role="status">Checking your session…</p> : <form onSubmit={submit}>
      <label className="auth-label" htmlFor="workspace-password">Workspace password</label>
      <input id="workspace-password" className="auth-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus/>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>}
  </section></main>;
}
