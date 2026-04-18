import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Church, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    if (type !== 'recovery') {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || type !== 'recovery') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '20px',
        }}
      >
        <Card style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <Church size={40} color="#d97706" />
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#f8fafc' }}>RECHOIR</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Invalid Reset Link
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {error || 'This password reset link is invalid or has expired. Please request a new password reset.'}
          </div>

          <Button 
            onClick={() => navigate('/login')} 
            style={{ width: '100%' }}
          >
            Back to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '20px',
        }}
      >
        <Card style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
              <Church size={40} color="#d97706" />
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#f8fafc' }}>RECHOIR</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Password Reset Complete!
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid #059669',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px',
              color: '#059669',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Your password has been reset successfully! Redirecting to login...
          </div>

          <Button 
            onClick={() => navigate('/login')} 
            style={{ width: '100%' }}
          >
            Go to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '20px',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <Church size={40} color="#d97706" />
            <span style={{ fontSize: '32px', fontWeight: '700', color: '#f8fafc' }}>RECHOIR</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Reset Your Password
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              style={{ paddingLeft: '40px', paddingRight: '40px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '38px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{ paddingLeft: '40px', paddingRight: '40px' }}
              required
            />
          </div>

          <Button type="submit" isLoading={isLoading} style={{ width: '100%' }}>
            Reset Password
          </Button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Back to Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;