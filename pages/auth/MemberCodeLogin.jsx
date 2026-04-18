import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Church, Mail, Lock, Eye, EyeOff, Key } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { supabase } from '../../services/supabase';
import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const MemberCodeLogin = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const colors = getThemeColors(isDark);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setIsLoading(true);

    try {
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('*, teams(*)')
        .eq('email', formData.email)
        .single();

      if (memberError || !member) {
        setError('No account found with this email');
        return;
      }

      if (member.password_hash !== formData.password) {
        setError('Invalid password');
        return;
      }

      if (!member.is_active) {
        setError('Your account has been deactivated. Contact your team lead.');
        return;
      }

      localStorage.setItem('rechoir_user', JSON.stringify({ 
        id: member.id, 
        email: member.email, 
        name: member.name, 
        role: 'MEMBER' 
      }));
      localStorage.setItem('rechoir_token', 'member-' + member.id);
      if (member.teams) {
        localStorage.setItem('rechoir_team', JSON.stringify(member.teams));
      }
      
      navigate('/member/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
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
      <Card style={{ width: '100%', maxWidth: '420px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '10px', padding: '8px' }}>
              <Church size={32} color="#fff" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>RECHOIR</span>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            Team Member Login
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
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

          <Button type="submit" isLoading={isLoading} style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
            Login
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: colors.textSecondary, fontSize: '14px' }}>
          New member?{' '}
          <Link to="/member-register" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '500' }}>
            Register here
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '12px', color: colors.textSecondary, fontSize: '14px' }}>
          Team Lead?{' '}
          <Link to="/login" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '500' }}>
            Sign in here
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default MemberCodeLogin;