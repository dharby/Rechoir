import { useQuery } from '@tanstack/react-query';
import { Users, Heart, DollarSign, Calendar, Music } from 'lucide-react';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

const Dashboard = () => {
  const { profile, team } = useAuthStore();
  
  const teamFromStorage = team || JSON.parse(localStorage.getItem('rechoir_team') || 'null');
  const accessCode = localStorage.getItem('rechoir_access_code');

  const { data: members } = useQuery({
    queryKey: ['members', teamFromStorage?.id],
    queryFn: async () => {
      if (!teamFromStorage?.id) return [];
      const { data } = await supabase.from('team_members').select('*').eq('team_id', teamFromStorage.id);
      return data || [];
    },
    enabled: !!teamFromStorage?.id,
  });

  const { data: upcomingRehearsals } = useQuery({
    queryKey: ['upcoming-rehearsals'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('rehearsals')
        .select('*')
        .gte('date', today)
        .order('date')
        .limit(5);
      return data || [];
    },
  });

  const { data: songs } = useQuery({
    queryKey: ['songs-readiness'],
    queryFn: async () => {
      const today = new Date();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      
      const { data } = await supabase
        .from('songs')
        .select(`
          *,
          song_assignments(
            status
          )
        `)
        .lte('target_readiness_date', endOfWeek.toISOString().split('T')[0])
        .order('target_readiness_date')
        .limit(5);
      
      return data?.map(song => {
        const total = song.song_assignments?.length || 0;
        const ready = song.song_assignments?.filter(
          a => a.status === 'READY' || a.status === 'PERFECT'
        ).length || 0;
        return {
          ...song,
          stats: { ready, total, percentage: total > 0 ? Math.round((ready / total) * 100) : 0 },
          daysUntil: Math.ceil((new Date(song.target_readiness_date) - today) / (1000 * 60 * 60 * 24)),
        };
      }) || [];
    },
  });

  const { data: prayerChains } = useQuery({
    queryKey: ['prayer-chains'],
    queryFn: async () => {
      const { data } = await supabase
        .from('prayer_chains')
        .select('*')
        .eq('status', 'ACTIVE');
      return data || [];
    },
  });

  const statCards = [
    {
      label: 'Team Members',
      value: members?.length || 0,
      icon: Users,
      color: '#1e40af',
      bgColor: 'rgba(30, 64, 175, 0.1)',
    },
    {
      label: 'Active Prayer Chains',
      value: prayerChains?.length || 0,
      icon: Heart,
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
    },
    {
      label: 'Upcoming Rehearsals',
      value: upcomingRehearsals?.length || 0,
      icon: Calendar,
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
    },
    {
      label: 'Songs This Week',
      value: songs?.length || 0,
      icon: Music,
      color: '#d97706',
      bgColor: 'rgba(217, 119, 6, 0.1)',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Welcome back, {profile?.name || 'User'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>
          {teamFromStorage?.name || 'Your Team'} - Team Dashboard
        </p>
        {accessCode && (
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(30, 64, 175, 0.1)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Team Access Code:</span>
            <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '18px', letterSpacing: '2px' }}>{accessCode}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {statCards.map((stat) => (
          <Card key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: stat.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>{stat.label}</p>
              <p style={{ color: '#f8fafc', fontSize: '24px', fontWeight: '700' }}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Upcoming Rehearsals</h2>
            <a href="/rehearsals" style={{ color: '#1e40af', fontSize: '14px', textDecoration: 'none' }}>View all</a>
          </div>
          
          {upcomingRehearsals?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingRehearsals.map((rehearsal) => (
                <div
                  key={rehearsal.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ color: '#f8fafc', fontWeight: '500', marginBottom: '4px' }}>{rehearsal.title}</p>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(rehearsal.date).toLocaleDateString()} at {rehearsal.start_time}
                    </p>
                  </div>
                  <Badge variant="primary">{rehearsal.location || 'TBD'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
              <Calendar size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No upcoming rehearsals</p>
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>Weekly Song Readiness</h2>
            <a href="/songs" style={{ color: '#1e40af', fontSize: '14px', textDecoration: 'none' }}>View all</a>
          </div>
          
          {songs?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {songs.map((song) => (
                <div key={song.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Music size={16} color="#94a3b8" />
                      <span style={{ color: '#f8fafc', fontWeight: '500' }}>{song.title}</span>
                      {song.song_key && <Badge variant="secondary">{song.song_key}</Badge>}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>{song.daysUntil}d left</span>
                  </div>
                  <ProgressBar value={song.stats?.percentage || 0} showLabel />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
              <Music size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No songs scheduled</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;