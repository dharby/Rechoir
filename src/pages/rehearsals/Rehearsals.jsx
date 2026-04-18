import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const Rehearsals = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: rehearsals, isLoading } = useQuery({
    queryKey: ['rehearsals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rehearsals')
        .select(`
          *,
          attendance(
            *,
            team_members(id, name, email)
          )
        `)
        .order('date', { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ title, date, start_time, end_time, location, agenda }) => {
      const { data: rehearsal, error } = await supabase
        .from('rehearsals')
        .insert({ title, date, start_time, end_time, location, agenda, team_id: team?.id })
        .select()
        .single();

      if (error) throw error;

      const { data: members } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team?.id)
        .eq('is_active', true);

      if (members?.length > 0) {
        const attendanceRecords = members.map(m => ({
          rehearsal_id: rehearsal.id,
          member_id: m.id,
          status: 'ABSENT',
        }));
        await supabase.from('attendance').insert(attendanceRecords);
      }

      return rehearsal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rehearsals']);
      setShowAddModal(false);
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ rehearsalId, memberId, status }) => {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          rehearsal_id: rehearsalId,
          member_id: memberId,
          status,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rehearsals']);
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Rehearsals
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Schedule and track rehearsal attendance
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Schedule Rehearsal
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
      ) : rehearsals?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rehearsals.map((rehearsal) => {
            const present = rehearsal.attendance?.filter(a => a.status === 'PRESENT').length || 0;
            const absent = rehearsal.attendance?.filter(a => a.status === 'ABSENT').length || 0;
            const total = rehearsal.attendance?.length || 0;

            return (
              <Card key={rehearsal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(30, 64, 175, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: '#1e40af', fontSize: '20px', fontWeight: '700' }}>
                        {format(new Date(rehearsal.date), 'd')}
                      </span>
                      <span style={{ color: '#1e40af', fontSize: '12px', textTransform: 'uppercase' }}>
                        {format(new Date(rehearsal.date), 'MMM')}
                      </span>
                    </div>
                    <div>
                      <h3 style={{ color: '#f8fafc', fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>
                        {rehearsal.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '20px', color: '#94a3b8', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          {rehearsal.start_time} - {rehearsal.end_time}
                        </div>
                        {rehearsal.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} />
                            {rehearsal.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Users size={16} color="#94a3b8" />
                      <span style={{ color: '#f8fafc', fontWeight: '600' }}>
                        {present}/{total}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>present</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {present > 0 && <Badge variant="success">{present} here</Badge>}
                      {absent > 0 && <Badge variant="danger">{absent} absent</Badge>}
                    </div>
                  </div>
                </div>
                {rehearsal.agenda && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>{rehearsal.agenda}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <Calendar size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Rehearsals Scheduled
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Schedule your first rehearsal to start tracking attendance
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Schedule Rehearsal
          </Button>
        </Card>
      )}

      <AddRehearsalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

const AddRehearsalModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    agenda: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Rehearsal" size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Rehearsal Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Sunday Service Rehearsal"
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Church Hall"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Start Time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
          <Input
            label="End Time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Agenda / Notes
          </label>
          <textarea
            value={formData.agenda}
            onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
            placeholder="What's on the rehearsal agenda?"
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
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Rehearsals;