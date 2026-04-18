import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Heart, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const PrayerChains = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  console.log('PrayerChains - team from store:', team);
  console.log('PrayerChains - team.id:', team?.id);

  const { data: chains, isLoading } = useQuery({
    queryKey: ['prayer-chains', team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      console.log('Fetching prayer chains for team:', team.id);
      const { data, error } = await supabase
        .from('prayer_chains')
        .select(`
          *,
          prayer_chain_assignments(
            *,
            team_members(name, email)
          )
        `)
        .eq('team_id', team.id)
        .order('created_at', { ascending: false });
      
      console.log('Chains response:', data, error);
      return data || [];
    },
    enabled: !!team?.id,
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, description, type, dayOption, startTime, endTime }) => {
      console.log('Creating prayer chain with:', { name, description, type, dayOption, startTime, endTime });
      const startDate = new Date().toISOString();
      
      if (!team?.id) {
        throw new Error('No team found. Please login again.');
      }
      
      const insertData = { 
        name, 
        description, 
        type, 
        start_date: startDate,
        team_id: team.id
      };
      
      if (dayOption) insertData.day_option = dayOption;
      if (startTime) insertData.start_time = startTime;
      if (endTime) insertData.end_time = endTime;
      
      console.log('Insert data:', insertData);
      
      const { data: chain, error } = await supabase
        .from('prayer_chains')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert result:', chain, error);
      if (error) {
        console.error('Create prayer chain error:', error);
        throw new Error(error.message || 'Failed to create prayer chain');
      }
      return chain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prayer-chains']);
      setShowAddModal(false);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (chainId) => {
      await supabase
        .from('prayer_chain_assignments')
        .update({ status: 'COMPLETED' })
        .eq('chain_id', chainId);

      const { data } = await supabase
        .from('prayer_chains')
        .update({ end_date: new Date().toISOString() })
        .eq('id', chainId)
        .select()
        .single();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prayer-chains']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (chainId) => {
      await supabase.from('prayer_chain_assignments').delete().eq('chain_id', chainId);
      const { error } = await supabase.from('prayer_chains').delete().eq('id', chainId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prayer-chains']);
    },
    onError: (error) => {
      alert('Failed to delete: ' + error.message);
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Prayer Chains
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Manage prayer chains and track prayer requests
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Create Prayer Chain
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
      ) : chains?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {chains.map((chain) => (
            <Card key={chain.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Heart size={20} color="#dc2626" />
                  </div>
                  <div>
                    <h3 style={{ color: '#f8fafc', fontWeight: '600', marginBottom: '4px' }}>{chain.name}</h3>
                    <Badge variant={chain.type === 'CONTINUOUS' ? 'primary' : 'secondary'}>
                      {chain.type}
                    </Badge>
                  </div>
                </div>
              </div>

              {chain.description && (
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
                  {chain.description}
                </p>
              )}

               <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                   <Calendar size={14} />
                   {format(new Date(chain.start_date), 'MMM d, yyyy')}
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                   <Users size={14} />
                   {chain.prayer_chain_assignments?.length || 0} members
                 </div>
                 {chain.day_option && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                     <span style={{ fontWeight: '500' }}>Day: </span>
                     <span>{chain.day_option.replace('_', ' ').toLowerCase()}</span>
                   </div>
                 )}
                 {chain.start_time && chain.end_time && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                     <span style={{ fontWeight: '500' }}>Time: </span>
                     <span>{chain.start_time} - {chain.end_time}</span>
                   </div>
                 )}
               </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (confirm('Delete this prayer chain?')) {
                      deleteMutation.mutate(chain.id);
                    }
                  }}
                  style={{ color: '#ef4444' }}
                >
                  Delete
                </Button>
                <Button variant="ghost" size="sm" style={{ flex: 1 }}>
                  View Details
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => completeMutation.mutate(chain.id)}
                >
                  Mark Answered
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <Heart size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No Prayer Chains Yet
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Create your first prayer chain to start tracking prayer requests
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Create Prayer Chain
          </Button>
        </Card>
      )}

      <CreateChainModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => {
          console.log('Modal submit called with:', data);
          createMutation.mutate(data);
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

const CreateChainModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CONTINUOUS',
    start_date: '',
    end_date: '',
    dayOption: 'EVERYDAY',
    startTime: '00:00',
    endTime: '23:59',
  });

   const handleSubmit = (e) => {
     e.preventDefault();
     onSubmit({
       ...formData,
       dayOption: formData.dayOption,
       startTime: formData.startTime,
       endTime: formData.endTime,
     });
   };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Prayer Chain" size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Chain Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 30-Day Breakthrough Chain"
          required
        />

        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the purpose of this prayer chain..."
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

        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Chain Type
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'CONTINUOUS' })}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: formData.type === 'CONTINUOUS' ? '2px solid #1e40af' : '1px solid #334155',
                backgroundColor: formData.type === 'CONTINUOUS' ? 'rgba(30, 64, 175, 0.1)' : 'transparent',
                color: formData.type === 'CONTINUOUS' ? '#f8fafc' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Continuous (24/7)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'SCHEDULED' })}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: formData.type === 'SCHEDULED' ? '2px solid #1e40af' : '1px solid #334155',
                backgroundColor: formData.type === 'SCHEDULED' ? 'rgba(30, 64, 175, 0.1)' : 'transparent',
                color: formData.type === 'SCHEDULED' ? '#f8fafc' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Scheduled
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Recurring Day
          </label>
          <select
            value={formData.dayOption}
            onChange={(e) => setFormData({ ...formData, dayOption: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
            }}
          >
            <option value="EVERYDAY">Every Day</option>
            <option value="MONDAY">Every Monday</option>
            <option value="TUESDAY">Every Tuesday</option>
            <option value="WEDNESDAY">Every Wednesday</option>
            <option value="THURSDAY">Every Thursday</option>
            <option value="FRIDAY">Every Friday</option>
            <option value="SATURDAY">Every Saturday</option>
            <option value="SUNDAY">Every Sunday</option>
            <option value="WEEKDAYS">Weekdays (Mon-Fri)</option>
            <option value="WEEKENDS">Weekends (Sat-Sun)</option>
            <option value="MON_WED_FRI">Mon, Wed, Fri</option>
            <option value="TUE_THU">Tue, Thu</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Start Time"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
<Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} style={{ flex: 1 }}>
            Create Chain
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PrayerChains;