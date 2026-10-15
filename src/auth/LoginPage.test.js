import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LoginPage from './LoginPage';
import { AuthProvider } from './AuthContext';

// Mock authApi to prevent real network calls
jest.mock('../services/authApi', () => ({
  restoreSession: jest.fn().mockResolvedValue(null),
  setCsrfToken: jest.fn(),
  signIn: jest.fn(),
  registerAccount: jest.fn(),
  verifyRegistrationCode: jest.fn(),
  resendRegistrationCode: jest.fn(),
  requestPasswordReset: jest.fn(),
  verifyResetCode: jest.fn(),
  resendResetCode: jest.fn(),
  resetPassword: jest.fn(),
  signOut: jest.fn(),
}));

describe('LoginPage component', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/login');
  });

  test('renders login form by default with forgot password link', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );
    });

    // Initial sign-in elements
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign in$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot password\?/i })).toBeInTheDocument();
  });

  test('switches to forgot password mode when Forgot Password is clicked', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );
    });

    const forgotBtn = screen.getByRole('button', { name: /Forgot password\?/i });
    await act(async () => {
      fireEvent.click(forgotBtn);
    });

    expect(screen.getByRole('heading', { name: /Reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send reset code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to sign in/i })).toBeInTheDocument();
  });

  test('switches back to sign in when Back to sign in is clicked', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));
    });
    expect(screen.getByRole('heading', { name: /Reset your password/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Back to sign in/i }));
    });
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });

  test('switches to registration mode when Create an account is clicked', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create an account/i }));
    });

    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });
});
