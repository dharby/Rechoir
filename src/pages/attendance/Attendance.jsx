import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const Attendance = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('REHEARSAL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: members } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', team?.id)
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: rehearsals } = useQuery({
    queryKey: ['rehearsals', team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rehearsals')
        .select('*')
        .eq('team_id', team?.id)
        .order('date', { ascending: false });
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: prayerChains } = useQuery({
    queryKey: ['prayer-chains', team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('prayer_chains')
        .select('*')
        .eq('team_id', team?.id);
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: services } = useQuery({
    queryKey: ['services', team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('team_id', team?.id)
        .order('date', { ascending: false });
      return data || [];
    },
    enabled: !!team?.id,
  });

  const { data: attendanceRecords, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', selectedDate, selectedEventType],
    queryFn: async () => {
      let query = supabase.from('attendance').select('*');
      
      if (selectedEventType === 'REHEARSAL' && rehearsals?.length > 0) {
        const rehearsal = rehearsals.find(r => isSameDay(new Date(r.date), new Date(selectedDate)));
        if (rehearsal) {
          query = query.eq('rehearsal_id', rehearsal.id);
        } else {
          return [];
        }
      }
      
      const { data } = await query;
      return data || [];
    },
    enabled: !!selectedDate && !!selectedEventType,
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ memberId, status }) => {
      let record = attendanceRecords?.find(r => r.member_id === memberId);
      
      if (record) {
        const { error } = await supabase
          .from('attendance')
          .update({ status, arrival_time: status === 'PRESENT' ? new Date().toISOString() : null })
          .eq('id', record.id);
        if (error) throw error;
      } else {
        let eventId = null;
        let rehearsalId = null;
        
        if (selectedEventType === 'REHEARSAL') {
          const rehearsal = rehearsals?.find(r => isSameDay(new Date(r.date), new Date(selectedDate)));
          rehearsalId = rehearsal?.id;
        }
        
        const { error } = await supabase.from('attendance').insert({
          member_id: memberId,
          status,
          event_type: selectedEventType,
          event_id: eventId,
          rehearsal_id: rehearsalId,
          arrival_time: status === 'PRESENT' ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
    },
  });

  const getStatusForMember = (memberId) => {
    const record = attendanceRecords?.find(r => r.member_id === memberId);
    return record?.status || 'ABSENT';
  };

  const getPresentCount = () => {
    return attendanceRecords?.filter(r => r.status === 'PRESENT').length || 0;
  };

  const getAbsentCount = () => {
    return attendanceRecords?.filter(r => r.status === 'ABSENT').length || 0;
  };

  const getExcusedCount = () => {
    return attendanceRecords?.filter(r => r.status === 'EXCUSED').length || 0;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Attendance
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Track attendance for prayers, rehearsals, and services
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        <Card>
          <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Select Event
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {['REHEARSAL', 'PRAYER', 'SERVICE'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedEventType(type)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedEventType === type ? '2px solid #1e40af' : '1px solid #334155',
                  backgroundColor: selectedEventType === type ? 'rgba(30, 64, 175, 0.1)' : 'transparent',
                  color: selectedEventType === type ? '#f8fafc' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500',
                }}
              >
                {type === 'REHEARSAL' && '🎵 Rehearsal'}
                {type === 'PRAYER' && '🙏 Prayer'}
                {type === 'SERVICE' && '⛪ Service'}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
            }}
          />

          {selectedEventType === 'REHEARSAL' && rehearsals?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Rehearsals on this date
              </label>
              {rehearsals
                .filter(r => isSameDay(new Date(r.date), new Date(selectedDate)))
                .map(r => (
                  <div key={r.id} style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', marginBottom: '8px' }}>
                    <p style={{ color: '#f8fafc', fontSize: '14px' }}>{r.title}</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>{r.start_time} - {r.end_time}</p>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '600' }}>
                {selectedEventType === 'REHEARSAL' && 'Rehearsal'}
                {selectedEventType === 'PRAYER' && 'Prayer'}
                {selectedEventType === 'SERVICE' && 'Service'} Attendance
              </h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ color: '#22c55e', fontSize: '14px' }}>
                  Present: {getPresentCount()}
                </span>
                <span style={{ color: '#ef4444', fontSize: '14px' }}>
                  Absent: {getAbsentCount()}
                </span>
                <span style={{ color: '#f59e0b', fontSize: '14px' }}>
                  Excused: {getExcusedCount()}
                </span>
              </div>
            </div>

            {loadingAttendance ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Loading...
              </div>
            ) : members?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No members found. Add members first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members?.map((member) => {
                  const status = getStatusForMember(member.id);
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#1e40af',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '600',
                        }}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '500' }}>{member.name}</p>
                          <p style={{ color: '#94a3b8', fontSize: '12px' }}>{member.email}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => updateAttendanceMutation.mutate({ memberId: member.id, status: 'PRESENT' })}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: status === 'PRESENT' ? '#22c55e' : '#334155',
                            color: status === 'PRESENT' ? '#fff' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                          }}
                        >
                          <CheckCircle size={14} /> Present
                        </button>
                        <button
                          onClick={() => updateAttendanceMutation.mutate({ memberId: member.id, status: 'EXCUSED' })}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: status === 'EXCUSED' ? '#f59e0b' : '#334155',
                            color: status === 'EXCUSED' ? '#fff' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Excused
                        </button>
                        <button
                          onClick={() => updateAttendanceMutation.mutate({ memberId: member.id, status: 'ABSENT' })}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: status === 'ABSENT' ? '#ef4444' : '#334155',
                            color: status === 'ABSENT' ? '#fff' : '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                          }}
                        >
                          <XCircle size={14} /> Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;