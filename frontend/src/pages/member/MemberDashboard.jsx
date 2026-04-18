import { useQuery } from '@tanstack/react-query';
import { Music, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import Card from '../../components/ui/Card';

const MemberDashboard = () => {
  const userFromStorage = JSON.parse(localStorage.getItem('rechoir_user') || '{}');
  const teamFromStorage = JSON.parse(localStorage.getItem('rechoir_team') || 'null');

  const { data: songs } = useQuery({
    queryKey: ['member-songs'],
    queryFn: async () => {
      if (!teamFromStorage?.id) return [];
      const { data } = await supabase
        .from('songs')
        .select('*, song_assignments(*)')
        .eq('team_id', teamFromStorage.id)
        .order('target_readiness_date');
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['member-payments'],
    queryFn: async () => {
      if (!teamFromStorage?.id || !userFromStorage.id) return [];
      const { data } = await supabase
        .from('payment_records')
        .select(`
          *,
          due_payments(*)
        `)
        .eq('member_id', userFromStorage.id)
        .order('due_payments.due_date', { ascending: true });
      return data || [];
    },
  });

  const getStatusBadge = (record) => {
    if (record.is_paid) {
      return <span style={{ color: '#10b981', fontWeight: '600' }}>Paid</span>;
    }
    if (record.amount_paid && record.amount_paid > 0) {
      return <span style={{ color: '#f59e0b', fontWeight: '600' }}>Partial</span>;
    }
    return <span style={{ color: '#ef4444', fontWeight: '600' }}>Not Paid</span>;
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Welcome back, {userFromStorage.name || 'Member'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>
          {teamFromStorage?.name || 'Your Choir'} - Member Dashboard
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <Card style={{ textAlign: 'center', padding: '24px' }}>
          <Music size={32} color="#1e40af" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>Songs</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>View and practice your songs</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: '24px' }}>
          <MessageSquare size={32} color="#059669" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>Chat</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Connect with your team</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: '24px' }}>
          <Calendar size={32} color="#d97706" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>Schedule</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>View upcoming rehearsals</p>
        </Card>
      </div>

      <Card>
        <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          My Practice Songs
        </h2>
        {songs?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {songs.slice(0, 5).map((song) => (
              <div key={song.id} style={{ 
                padding: '16px', 
                backgroundColor: '#0f172a', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ color: '#f8fafc', fontWeight: '500' }}>{song.title}</p>
                  {song.song_key && <span style={{ color: '#94a3b8', fontSize: '12px' }}>Key: {song.song_key}</span>}
                </div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Due: {song.target_readiness_date}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
            No songs assigned yet. Check back later!
          </p>
        )}
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={20} color="#f59e0b" />
          My Payments
        </h2>
        {payments?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {payments.map((record) => (
              <div key={record.id} style={{ 
                padding: '16px', 
                backgroundColor: '#0f172a', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ color: '#f8fafc', fontWeight: '500' }}>{record.due_payments?.title}</p>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    Due: {record.due_payments?.due_date ? format(new Date(record.due_payments.due_date), 'MMM d, yyyy') : '-'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#f8fafc', fontWeight: '600', fontSize: '16px' }}>
                    ₦{Number(record.due_payments?.amount || 0).toLocaleString('en-NG')}
                  </p>
                  {getStatusBadge(record)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
            No payments assigned yet.
          </p>
        )}
      </Card>
    </div>
  );
};

export default MemberDashboard;