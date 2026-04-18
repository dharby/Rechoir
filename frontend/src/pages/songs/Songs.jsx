import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Music, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';

const Songs = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: songs, isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('songs')
        .select(`
          *,
          song_assignments(
            *,
            team_members(name, email, specialization)
          )
        `)
        .order('target_readiness_date', { ascending: true });
      
      return data?.map(song => {
        const total = song.song_assignments?.length || 0;
        const ready = song.song_assignments?.filter(
          a => a.status === 'READY' || a.status === 'PERFECT'
        ).length || 0;
        const percentage = total > 0 ? Math.round((ready / total) * 100) : 0;
        
        return {
          ...song,
          stats: { ready, total, percentage },
          daysUntil: Math.ceil((new Date(song.target_readiness_date) - new Date()) / (1000 * 60 * 60 * 24)),
        };
      }) || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ title, song_key, youtube_url, practice_notes, target_readiness_date, member_ids }) => {
      const { data: song, error } = await supabase
        .from('songs')
        .insert({ title, song_key, youtube_url, practice_notes, target_readiness_date, team_id: team?.id })
        .select()
        .single();

      if (error) throw error;

      if (member_ids?.length > 0) {
        const assignments = member_ids.map(member_id => ({
          song_id: song.id,
          member_id,
          status: 'NOT_STARTED',
        }));
        await supabase.from('song_assignments').insert(assignments);
      }

      return song;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['songs']);
      setShowAddModal(false);
    },
  });

  const getStatusBadge = (song) => {
    if (song.stats?.percentage === 100) return <Badge variant="success">All Ready</Badge>;
    if (song.stats?.percentage >= 60) return <Badge variant="warning">Mostly Ready</Badge>;
    if (song.stats?.percentage > 0) return <Badge variant="primary">In Progress</Badge>;
    return <Badge variant="default">Not Started</Badge>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Songs & Readiness
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Track song preparation and member readiness for Sunday services
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Song
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
      ) : songs?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {songs.map((song) => (
            <Card key={song.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Music size={24} color="#1e40af" />
                  </div>
                  <div>
                    <h3 style={{ color: '#f8fafc', fontWeight: '600' }}>{song.title}</h3>
                    {song.song_key && <Badge variant="secondary">{song.song_key}</Badge>}
                  </div>
                </div>
                {getStatusBadge(song)}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Team Readiness</span>
                  <span style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '500' }}>
                    {song.stats?.ready || 0}/{song.stats?.total || 0} ready
                  </span>
                </div>
                <ProgressBar value={song.stats?.percentage || 0} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '14px' }}>
                    <CheckCircle size={14} /> {song.stats?.ready || 0}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                    <Clock size={14} /> {song.daysUntil}d left
                  </div>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {format(new Date(song.target_readiness_date), 'MMM d')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <Music size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Songs Yet
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Add songs to track preparation and readiness for Sunday services
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Song
          </Button>
        </Card>
      )}

      <AddSongModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

const AddSongModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    song_key: '',
    youtube_url: '',
    practice_notes: '',
    target_readiness_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Song" size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Song Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Amazing Grace"
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Key"
            value={formData.song_key}
            onChange={(e) => setFormData({ ...formData, song_key: e.target.value })}
            placeholder="e.g., G Major"
          />
          <Input
            label="Target Date"
            type="date"
            value={formData.target_readiness_date}
            onChange={(e) => setFormData({ ...formData, target_readiness_date: e.target.value })}
            required
          />
        </div>

        <Input
          label="YouTube URL (optional)"
          value={formData.youtube_url}
          onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
          placeholder="https://youtube.com/..."
        />

        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Practice Notes
          </label>
          <textarea
            value={formData.practice_notes}
            onChange={(e) => setFormData({ ...formData, practice_notes: e.target.value })}
            placeholder="Add any practice notes or instructions..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} style={{ flex: 1 }}>
            Add Song
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Songs;