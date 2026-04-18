import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Users, Bell } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { notificationsApi } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Broadcast = () => {
  const { profile, team } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [success, setSuccess] = useState(null);

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const result = await notificationsApi.broadcast(
        team?.id,
        formData.title,
        formData.message,
        profile?.id
      );
      return result;
    },
    onSuccess: (data) => {
      setSuccess(`Message sent to ${data.count} members!`);
      setFormData({ title: '', message: '' });
      setTimeout(() => setSuccess(null), 5000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;
    broadcastMutation.mutate();
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Broadcast Message
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>
          Send notifications to all team members at once
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={24} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Send to All Members</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>This will send a notification to everyone in your team</p>
            </div>
          </div>

          {success && (
            <div style={{
              backgroundColor: 'rgba(5, 150, 105, 0.15)',
              border: '1px solid #059669',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#059669',
              fontSize: '14px',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Message Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Important Update"
              required
            />

            <div>
              <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your message here..."
                rows={5}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <Button type="submit" isLoading={broadcastMutation.isPending}>
              <Send size={16} style={{ marginRight: '8px' }} />
              Broadcast to All Members
            </Button>
          </form>
        </Card>

        <Card>
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
              <Users size={24} color="#1e40af" />
            </div>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '600' }}>Team Members</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Message will be sent to all active team members</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Broadcast;