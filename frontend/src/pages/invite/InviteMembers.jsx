import { useState } from 'react';
import { Link2, Copy, Check, QrCode } from 'lucide-react';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const InviteMembers = () => {
  const { team } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const inviteLink = `${window.location.origin}/member-register?team=${team?.id || ''}`;
  const inviteCode = team?.code || '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Invite Members
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>
          Generate a unique link for members to join your choir
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(30, 64, 175, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Link2 size={20} color="#1e40af" />
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Invite Link</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Share this link with members</p>
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            marginBottom: '16px',
            wordBreak: 'break-all',
            fontSize: '14px',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}>
            {inviteLink}
          </div>

          <Button onClick={handleCopyLink} style={{ width: '100%' }}>
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
          </Button>

          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
            Members who click this link will be able to register themselves to your choir
          </p>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <QrCode size={20} color="#22c55e" />
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Team Code</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Alternative: Share this code</p>
            </div>
          </div>

          <div style={{
            padding: '24px',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ color: '#f8fafc', fontSize: '32px', fontWeight: '700', letterSpacing: '8px' }}>
              {inviteCode}
            </span>
          </div>

          <Button variant="secondary" style={{ width: '100%' }} onClick={handleCopyLink}>
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
          </Button>

          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
            Members can also use this code on the member registration page
          </p>
        </Card>
      </div>

      <Card style={{ marginTop: '24px' }}>
        <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          How it works
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#1e40af',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
            }}>1</div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Share the invite link or code with members</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#1e40af',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
            }}>2</div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Members click the link and fill their details</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#1e40af',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
            }}>3</div>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>They receive a password and can login with email + password</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InviteMembers;