import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shirt, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';

const Uniforms = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['uniform-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('uniform_events')
        .select(`
          *,
          uniform_readiness(
            *,
            team_members(name, email)
          )
        `)
        .order('date', { ascending: true });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, date, description, image_url, member_ids }) => {
      const { data: event, error } = await supabase
        .from('uniform_events')
        .insert({ name, date, description, image_url, team_id: team?.id })
        .select()
        .single();

      if (error) throw error;

      if (member_ids?.length > 0) {
        const readiness = member_ids.map(member_id => ({
          event_id: event.id,
          member_id,
          is_ready: false,
        }));
        await supabase.from('uniform_readiness').insert(readiness);
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['uniform-events']);
      setShowAddModal(false);
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Uniform Calendar
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Track uniform readiness for events and services
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Event
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
      ) : events?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {events.map((event) => {
            const total = event.uniform_readiness?.length || 0;
            const ready = event.uniform_readiness?.filter(r => r.is_ready).length || 0;
            const percentage = total > 0 ? Math.round((ready / total) * 100) : 0;

            return (
              <Card key={event.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(217, 119, 6, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Shirt size={24} color="#d97706" />
                    </div>
                    <div>
                      <h3 style={{ color: '#f8fafc', fontWeight: '600' }}>{event.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                        <Calendar size={14} />
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                    {event.description}
                  </p>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Uniform Readiness</span>
                    <span style={{ color: '#f8fafc', fontSize: '14px' }}>
                      {ready}/{total} ready
                    </span>
                  </div>
                  <ProgressBar value={percentage} />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {event.uniform_readiness?.slice(0, 5).map((r) => (
                    <Badge
                      key={r.id}
                      variant={r.is_ready ? 'success' : 'default'}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {r.is_ready && <CheckCircle size={12} />}
                      {r.profiles?.full_name?.split(' ')[0]}
                    </Badge>
                  ))}
                  {total > 5 && (
                    <Badge variant="default">+{total - 5} more</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <Shirt size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Uniform Events Yet
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Add uniform events to track readiness for services
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Event
          </Button>
        </Card>
      )}

      <AddUniformEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

const AddUniformEventModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Uniform Event" size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Event Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Easter Sunday Service"
          required
        />
        <Input
          label="Event Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Uniform Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the required uniform..."
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
            Create Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Uniforms;