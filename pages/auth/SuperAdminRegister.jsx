import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Church, Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { superAdminAuth } from '../../services/api';
import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const SuperAdminRegister = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const colors = getThemeColors(isDark);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamName: '',
    phone: '',
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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await superAdminAuth.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        teamName: formData.teamName,
        phone: formData.phone,
      });

      if (!result.success) {
        setError(result.error || 'Registration failed');
        return;
      }

      localStorage.setItem('rechoir_user', JSON.stringify({ name: formData.name, email: formData.email, role: 'SUPER_ADMIN' }));
      localStorage.setItem('rechoir_token', 'registered');
      if (result.team) {
        localStorage.setItem('rechoir_team', JSON.stringify(result.team));
      }
      if (result.accessCode) {
        localStorage.setItem('rechoir_access_code', result.accessCode);
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
        background: isDark 
          ? 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
          : 'radial-gradient(circle at center, #f1f5f9 0%, #f8fafc 100%)',
        padding: '20px',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '480px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '10px', padding: '8px' }}>
              <Church size={32} color="#fff" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>RECHOIR</span>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            Create your admin account
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)',
              border: `1px solid ${colors.error}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: colors.error,
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Phone Number (Optional)"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Church size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Choir/Team Name"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              placeholder="e.g., Gospel Choir"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              style={{ paddingLeft: '44px', paddingRight: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '42px',
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <Button type="submit" isLoading={isLoading} style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
            Create Account
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: colors.textSecondary, fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '500' }}>
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default SuperAdminRegister;