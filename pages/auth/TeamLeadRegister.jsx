import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Church, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const TeamLeadRegister = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    teamName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { success, error: signUpError } = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        teamName: formData.teamName,
        role: 'TEAM_LEAD',
      });

      if (!success) {
        setError(signUpError || 'Registration failed');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

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
            Register Your Choir Team
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="Your Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Church size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="Choir/Team Name"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              placeholder="e.g., Gospel Choir, Senior Choir"
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '38px', color: '#94a3b8' }} />
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
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
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
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

          <Button type="submit" isLoading={isLoading} style={{ width: '100%', marginTop: '8px' }}>
            Create Team
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#94a3b8', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1e40af', textDecoration: 'none', fontWeight: '500' }}>
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default TeamLeadRegister;