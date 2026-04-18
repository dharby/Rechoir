import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';

const Checklists = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_checklists')
        .select(`
          *,
          checklist_items(
            *,
            team_members(name, email)
          )
        `)
        .order('week_start_date', { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ title, week_start_date, items }) => {
      const { data: checklist, error } = await supabase
        .from('weekly_checklists')
        .insert({ title, week_start_date, team_id: team?.id })
        .select()
        .single();

      if (error) throw error;

      if (items?.length > 0) {
        const checklistItems = items.map(item => ({
          checklist_id: checklist.id,
          member_id: item.member_id,
          description: item.description,
          is_completed: false,
        }));
        await supabase.from('checklist_items').insert(checklistItems);
      }

      return checklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['checklists']);
      setShowAddModal(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ checklistId, itemId }) => {
      const { data: item } = await supabase
        .from('checklist_items')
        .select('is_completed')
        .eq('id', itemId)
        .single();

      const { data, error } = await supabase
        .from('checklist_items')
        .update({ 
          is_completed: !item.is_completed, 
          completed_at: !item.is_completed ? new Date().toISOString() : null 
        })
        .eq('id', itemId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['checklists']);
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Weekly Checklists
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Track team productivity with weekly checklists
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Create Checklist
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
      ) : checklists?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {checklists.map((checklist) => {
            const total = checklist.checklist_items?.length || 0;
            const completed = checklist.checklist_items?.filter(i => i.is_completed).length || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={checklist.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CheckSquare size={24} color="#059669" />
                    </div>
                    <div>
                      <h3 style={{ color: '#f8fafc', fontWeight: '600' }}>{checklist.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                        <Calendar size={14} />
                        Week of {format(new Date(checklist.week_start_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <Badge variant={percentage === 100 ? 'success' : 'primary'}>
                    {percentage}%
                  </Badge>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <ProgressBar value={percentage} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
                    {completed} of {total} items completed
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {checklist.checklist_items?.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#0f172a',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{
                          color: item.is_completed ? '#059669' : '#f8fafc',
                          textDecoration: item.is_completed ? 'line-through' : 'none',
                          fontSize: '14px',
                        }}>
                          {item.description}
                        </span>
                        <button
                          onClick={() => toggleMutation.mutate({ checklistId: checklist.id, itemId: item.id })}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: `2px solid ${item.is_completed ? '#059669' : '#334155'}`,
                            backgroundColor: item.is_completed ? '#059669' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.is_completed && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" size="sm" style={{ width: '100%' }}>
                  View All Items
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <CheckSquare size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Checklists Yet
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Create your first weekly checklist to start tracking productivity
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Create Checklist
          </Button>
        </Card>
      )}

      <AddChecklistModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

const AddChecklistModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    week_start_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Checklist" size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Checklist Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Week 15 Productivity Goals"
          required
        />
        <Input
          label="Week Starting Date"
          type="date"
          value={formData.week_start_date}
          onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
          required
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} style={{ flex: 1 }}>
            Create Checklist
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Checklists;