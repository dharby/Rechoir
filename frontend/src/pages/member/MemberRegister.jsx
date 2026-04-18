import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Church, Mail, Lock, User, Eye, EyeOff, Key, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { getThemeColors } from '../../stores/themeStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const MemberRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('team') || '';
  const teamCodeFromUrl = searchParams.get('code') || '';
  
  const isDark = true;
  const colors = getThemeColors(isDark);
  
  const [teamInfo, setTeamInfo] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(!!teamId || !!teamCodeFromUrl);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialization: 'SINGER',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (teamId) {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();
        
        if (data) setTeamInfo(data);
      } else if (teamCodeFromUrl) {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('code', teamCodeFromUrl.toUpperCase())
          .single();
        
        if (data) {
          setTeamInfo(data);
        }
      }
      setLoadingTeam(false);
    };
    fetchTeam();
  }, [teamId, teamCodeFromUrl]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name || !formData.email) {
        throw new Error('Please fill in all required fields');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const targetTeamId = teamInfo?.id;
      if (!targetTeamId) {
        throw new Error('Invalid team. Please use a valid invite link.');
      }

      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/team_members?email=eq.${encodeURIComponent(formData.email)}&team_id=eq.${targetTeamId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      const existingMembers = await checkResponse.json();
      
      if (existingMembers && existingMembers.length > 0) {
        throw new Error('You are already registered with this email. Please login instead.');
      }

      const accessCode = Math.random().toString().slice(2, 8).padStart(6, '0');
      
      const { data: member, error: insertError } = await supabase
        .from('team_members')
        .insert({
          email: formData.email,
          name: formData.name,
          phone: formData.phone || '',
          specialization: formData.specialization,
          team_id: targetTeamId,
          access_code_hash: accessCode,
          has_set_password: true,
          is_active: true,
          password_hash: formData.password,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message || 'Failed to register');
      }

      return { member, team: teamInfo };
    },
    onSuccess: (data) => {
      localStorage.setItem('rechoir_user', JSON.stringify({ 
        id: data.member.id, 
        email: data.member.email, 
        name: data.member.name, 
        role: 'MEMBER' 
      }));
      localStorage.setItem('rechoir_team', JSON.stringify(data.team));
      localStorage.setItem('rechoir_token', 'member-' + data.member.id);
      navigate('/member/dashboard');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate();
  };

  if (loadingTeam) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
      }}>
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (!teamInfo && !loadingTeam) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
          padding: '20px',
        }}
      >
        <Card style={{ width: '100%', maxWidth: '420px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <Church size={48} color="#ef4444" />
            </div>
            <h2 style={{ color: colors.text, fontSize: '20px', marginBottom: '12px' }}>Invalid Invite Link</h2>
            <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
              This invite link is invalid or has expired. Please ask your team lead for a new invite link.
            </p>
            <Link to="/member-code-login" style={{ color: colors.primary, textDecoration: 'none' }}>
              Already a member? Login here
            </Link>
          </div>
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
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
        padding: '20px',
      }}
    >
      <Card style={{ width: '100%', maxWidth: '480px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '10px', padding: '8px' }}>
              <Church size={32} color="#fff" />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '700', color: colors.text }}>RECHOIR</span>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            Join <strong style={{ color: colors.text }}>{teamInfo?.name || 'the choir'}</strong>
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.text, fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Your Role
            </label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.bg,
                color: colors.text,
                fontSize: '14px',
              }}
            >
              <option value="SINGER">Singer</option>
              <option value="INSTRUMENTALIST">Instrumentalist</option>
              <option value="Chorister">Chorister</option>
              <option value="Worship Leader">Worship Leader</option>
              <option value="Choir Master">Choir Master</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '42px', color: colors.textSecondary }} />
            <Input
              label="Create Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              style={{ paddingLeft: '44px', background: colors.bg, borderColor: colors.border }}
              required
            />
          </div>

          <Button type="submit" isLoading={registerMutation.isPending} style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }}>
            Join Choir
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: colors.textSecondary, fontSize: '14px' }}>
          Already registered?{' '}
          <Link to="/member-code-login" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '500' }}>
            Login here
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default MemberRegister;