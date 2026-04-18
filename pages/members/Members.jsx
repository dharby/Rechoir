import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Search, Key, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function membersFunction(data) {
  try {
    const url = `${SUPABASE_URL}/functions/v1/members`;
    console.log('Calling edge function:', url, data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(data)
    });
    
    console.log('Edge function response status:', response.status);
    const result = await response.json();
    console.log('Edge function response:', result);
    
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return result;
  } catch (err) {
    console.error('membersFunction error:', err);
    alert('Error: ' + err.message);
    throw err;
  }
}

const Members = () => {
  const { profile, team } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', team?.id],
    queryFn: async () => {
      if (!team?.id) {
        return [];
      }
      // Use direct supabase query instead of edge function
      const { data: directMembers, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', team.id);
      
      if (error) {
        console.error('Query error:', error);
        return [];
      }
      
      console.log('Members for team', team.id, ':', directMembers);
      return directMembers || [];
    },
    enabled: !!team?.id,
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (members) => {
      if (!team?.id) {
        throw new Error('Team not found');
      }
      
      const accessCode = Math.random().toString().slice(2, 8).padStart(6, '0');
      
      const result = await membersFunction({
        action: 'bulk-create',
        members,
        teamId: team.id,
        accessCode
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
      setShowBulkModal(false);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ email, name, phone, specialization }) => {
      if (!team?.id) {
        throw new Error('Team not found');
      }

      const accessCode = Math.random().toString().slice(2, 8).padStart(6, '0');

      console.log('Adding member:', { email, name, phone, specialization, teamId: team.id });

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          email,
          name,
          phone: phone || '',
          specialization: specialization || 'SINGER',
          team_id: team.id,
          access_code_hash: accessCode,
          has_set_password: false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Add member error:', error);
        throw new Error(error.message);
      }

      console.log('Member created:', data);
      return { ...data, accessCode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
      setShowAddModal(false);
    },
    onError: (error) => {
      console.error('Add member error:', error);
      alert(error.message);
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async (member) => {
      const result = await membersFunction({
        action: 'update',
        memberId: member.id,
        is_active: !member.is_active
      });
      return result.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async (memberId) => {
      const newCode = Math.random().toString().slice(2, 8).padStart(6, '0');
      const result = await membersFunction({
        action: 'update',
        memberId,
        accessCode: newCode
      });
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
    },
  });

  const filteredMembers = members?.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const specializationColors = {
    SINGER: '#1e40af',
    INSTRUMENTALIST: '#d97706',
    TEAM_LEAD: '#059669',
    OFFICER: '#dc2626',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Team Members
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Manage your choir team members
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Member
        </Button>
        <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
          <Upload size={16} /> Bulk Import
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Member</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers?.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar name={member.name} size="md" />
                        <div>
                          <p style={{ color: '#f8fafc', fontWeight: '500' }}>{member.name}</p>
                          <p style={{ color: '#94a3b8', fontSize: '14px' }}>{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge
                        style={{
                          backgroundColor: `${specializationColors[member.specialization]}20`,
                          color: specializationColors[member.specialization],
                        }}
                      >
                        {member.specialization?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge variant={member.is_active ? 'success' : 'danger'}>
                        {member.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => regenerateCodeMutation.mutate(member.id)}
                          style={{
                            padding: '8px',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          title="Regenerate Access Code"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => toggleAccessMutation.mutate(member)}
                          style={{
                            padding: '8px',
                            background: 'none',
                            border: 'none',
                            color: member.is_active ? '#dc2626' : '#059669',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          title={member.is_active ? 'Disable Access' : 'Enable Access'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addMemberMutation.mutate}
        isLoading={addMemberMutation.isPending}
      />

      <BulkImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={bulkImportMutation.mutate}
        isLoading={bulkImportMutation.isPending}
      />
    </div>
  );
};

const AddMemberModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    specialization: 'SINGER',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
            Specialization
          </label>
          <select
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
            <option value="SINGER">Singer</option>
            <option value="INSTRUMENTALIST">Instrumentalist</option>
            <option value="OFFICER">Officer</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} style={{ flex: 1 }}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const BulkImportModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [csvData, setCsvData] = useState('');
  const [preview, setPreview] = useState([]);

  const handleParse = () => {
    const lines = csvData.trim().split('\n');
    const parsed = lines.slice(1).map(line => {
      const [name, email, phone, specialization] = line.split(',').map(s => s.trim());
      return { name, email, phone, specialization };
    }).filter(p => p.name && p.email);
    setPreview(parsed);
  };

  const handleSubmit = () => {
    onSubmit(preview);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Members" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
            Paste CSV data (format: name, email, phone, specialization)
          </p>
          <textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="name,email,phone,specialization
John Doe,john@example.com,1234567890,SINGER
Jane Smith,jane@example.com,0987654321,INSTRUMENTALIST"
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>
        <Button variant="secondary" onClick={handleParse} disabled={!csvData}>
          Preview
        </Button>
        {preview.length > 0 && (
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontSize: '12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontSize: '12px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontSize: '12px' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '8px', color: '#f8fafc' }}>{p.name}</td>
                    <td style={{ padding: '8px', color: '#f8fafc' }}>{p.email}</td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>{p.specialization || 'SINGER'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={preview.length === 0} style={{ flex: 1 }}>
            Import {preview.length} Members
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Members;