import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Key, Building, Copy, Check } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { teamLeadAuth } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Settings = () => {
  const navigate = useNavigate();
  
  // Get from localStorage directly on load
  const [teamData, setTeamData] = useState(() => {
    const stored = localStorage.getItem('rechoir_team');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [accessCode, setAccessCode] = useState(() => {
    return localStorage.getItem('rechoir_access_code');
  });
  
  const [userData, setUserData] = useState(() => {
    const stored = localStorage.getItem('rechoir_user');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [teamName, setTeamName] = useState(teamData?.name || '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Show data on load
  useEffect(() => {
    console.log('Team:', teamData);
    console.log('Access Code:', accessCode);
    console.log('User:', userData);
  }, []);

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    console.log('Team ID:', teamData?.id);
    console.log('Team Name:', teamName);
    
    if (!teamName.trim()) {
      alert('Please enter a choir name');
      return;
    }
    
    if (!teamData?.id) {
      alert('No team ID found. Please login again from a new browser tab.');
      return;
    }
    
    setSaving(true);
    try {
      // First check if team exists
      const { data: checkTeam, error: checkError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', teamData.id)
        .single();
      
      console.log('Check team:', checkTeam, checkError);
      
      if (checkError) {
        alert('Cannot find team. Error: ' + checkError.message);
        setSaving(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('teams')
        .update({ name: teamName.trim() })
        .eq('id', teamData.id)
        .select();
      
      console.log('Update result:', data, error);
      
      if (error) {
        alert('Error updating: ' + error.message);
      } else {
        const updated = { ...teamData, name: teamName };
        localStorage.setItem('rechoir_team', JSON.stringify(updated));
        setTeamData(updated);
        alert('Choir name updated to: ' + teamName);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      const { success, error } = await teamLeadAuth.changePassword({
        email: userData?.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (!success) {
        setPasswordError(error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordChange(false), 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    }
  };

  // Debug: show what's in storage
  const debugInfo = (
    <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
      <p style={{ color: '#94a3b8' }}>Debug Info:</p>
      <p style={{ color: '#f8fafc' }}>Team ID: {teamData?.id || 'NOT FOUND'}</p>
      <p style={{ color: '#f8fafc' }}>Team Name: {teamData?.name || 'NOT FOUND'}</p>
      <p style={{ color: '#f8fafc' }}>Access Code: {accessCode || 'NOT FOUND'}</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Settings
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>
          Manage your choir and team settings
        </p>
      </div>

      {debugInfo}

      <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(30, 64, 175, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building size={24} color="#1e40af" />
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Choir Name</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Update your choir organization name</p>
            </div>
          </div>

          <form onSubmit={handleUpdateTeam} style={{ display: 'flex', gap: '12px' }}>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter choir name"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1e40af',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Key size={24} color="#059669" />
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Team Access Code</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Share this code with members to join</p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
          }}>
            <span style={{ color: '#f8fafc', fontSize: '24px', fontWeight: '700', letterSpacing: '4px' }}>
              {accessCode || 'NO CODE'}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                padding: '8px 16px',
                backgroundColor: '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Shield size={24} color="#1e40af" />
              </div>
              <div>
                <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Account</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Your admin account</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              style={{
                padding: '8px 16px',
                backgroundColor: showPasswordChange ? '#334155' : '#1e40af',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={16} color="#94a3b8" />
              <span style={{ color: '#94a3b8', minWidth: '60px' }}>Email:</span>
              <span style={{ color: '#f8fafc' }}>{userData?.email || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={16} color="#94a3b8" />
              <span style={{ color: '#94a3b8', minWidth: '60px' }}>Role:</span>
              <span style={{ color: '#f8fafc' }}>{userData?.role || 'Team Lead'}</span>
            </div>
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {passwordError && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px', border: '1px solid #dc2626', color: '#dc2626', fontSize: '14px' }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderRadius: '8px', border: '1px solid #059669', color: '#059669', fontSize: '14px' }}>
                  {passwordSuccess}
                </div>
              )}
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Current password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="New password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px',
                  backgroundColor: '#1e40af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Update Password
              </button>
            </form>
          )}
        </Card>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: 'fit-content',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;