import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, Heart, User, Plus, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const PrayerCalendar = () => {
  const { team } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChain, setSelectedChain] = useState(null);

  const { data: chains } = useQuery({
    queryKey: ['prayer-chains', team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('prayer_chains')
        .select(`
          *,
          prayer_chain_assignments(
            *,
            team_members(id, name, email)
          )
        `)
        .eq('team_id', team?.id);
      return data || [];
    },
    enabled: !!team?.id,
  });

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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayOptionLabel = (dayOption) => {
    const labels = {
      'EVERYDAY': 'Every Day',
      'MONDAY': 'Mondays',
      'TUESDAY': 'Tuesdays',
      'WEDNESDAY': 'Wednesdays',
      'THURSDAY': 'Thursdays',
      'FRIDAY': 'Fridays',
      'SATURDAY': 'Saturdays',
      'SUNDAY': 'Sundays',
      'WEEKDAYS': 'Weekdays',
      'WEEKENDS': 'Weekends',
      'MON_WED_FRI': 'Mon, Wed, Fri',
      'TUE_THU': 'Tue, Thu',
    };
    return labels[dayOption] || dayOption;
  };

  const getChainsForDay = (day) => {
    return chains?.filter(chain => {
      const dayOption = chain.day_option;
      if (!dayOption) return false;
      
      const dayName = format(day, 'EEEE').toUpperCase();
      
      if (dayOption === 'EVERYDAY') return true;
      if (dayOption === 'WEEKDAYS') return dayName !== 'SATURDAY' && dayName !== 'SUNDAY';
      if (dayOption === 'WEEKENDS') return dayName === 'SATURDAY' || dayName === 'SUNDAY';
      if (dayOption === 'MON_WED_FRI') return ['MONDAY', 'WEDNESDAY', 'FRIDAY'].includes(dayName);
      if (dayOption === 'TUE_THU') return ['TUESDAY', 'THURSDAY'].includes(dayName);
      
      return dayOption === dayName;
    }) || [];
  };

  const getAssignmentForChainAndDay = (chain, day) => {
    return chain.prayer_chain_assignments?.find(a => {
      if (!a.scheduled_time) return false;
      return isSameDay(new Date(a.scheduled_time), day);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            Prayer Calendar
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            View prayer schedules and assign members to lead prayers
          </p>
        </div>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: '600' }}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#334155' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ padding: '12px', textAlign: 'center', backgroundColor: '#1e293b' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{day}</span>
            </div>
          ))}
          
          {days.map((day, idx) => {
            const dayChains = getChainsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={idx}
                onClick={() => dayChains.length > 0 && setSelectedDay(day)}
                style={{
                  padding: '12px',
                  minHeight: '100px',
                  backgroundColor: isCurrentMonth ? '#0f172a' : '#1e293b',
                  cursor: dayChains.length > 0 ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                  border: isToday ? '2px solid #1e40af' : '1px solid #334155',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isToday ? '#1e40af' : 'transparent',
                  color: isToday ? '#fff' : isCurrentMonth ? '#f8fafc' : '#64748b',
                  fontSize: '14px',
                  fontWeight: isToday ? '600' : '400',
                  marginBottom: '8px',
                }}>
                  {format(day, 'd')}
                </div>
                
                {isCurrentMonth && dayChains?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayChains.slice(0, 3).map((chain) => {
                      const assignment = getAssignmentForChainAndDay(chain, day);
                      return (
                        <div key={chain.id} style={{
                          fontSize: '10px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          backgroundColor: assignment ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                          color: assignment ? '#4ade80' : '#fca5a5',
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                            {chain.name}
                          </div>
                          {chain.start_time && (
                            <div style={{ opacity: 0.8 }}>
                              {chain.start_time}-{chain.end_time}
                            </div>
                          )}
                          {assignment && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                              <User size={8} />
                              {assignment.team_members?.name?.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <DayDetailsModal
        day={selectedDay}
        chains={selectedDay ? getChainsForDay(selectedDay) : []}
        onClose={() => setSelectedDay(null)}
        onAssign={(chain, day) => {
          setSelectedChain(chain);
          setSelectedDay(day);
          setShowAssignModal(true);
        }}
      />

      <AssignMemberModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedChain(null);
        }}
        chain={selectedChain}
        selectedDay={selectedDay}
        members={members || []}
        queryClient={queryClient}
      />
    </div>
  );
};

const DayDetailsModal = ({ day, chains, onClose, onAssign }) => {
  if (!day) return null;

  return (
    <Modal isOpen={!!day} onClose={onClose} title={format(day, 'EEEE, MMMM d, yyyy')} size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {chains?.length > 0 ? (
          chains.map((chain) => {
            const assignment = chain.prayer_chain_assignments?.find(a => {
              if (!a.scheduled_time) return false;
              return isSameDay(new Date(a.scheduled_time), day);
            });
            
            return (
              <div key={chain.id} style={{
                padding: '16px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
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
                    <h4 style={{ color: '#f8fafc', fontWeight: '600' }}>{chain.name}</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{chain.day_option?.replace('_', ' ') || 'Daily'}</Badge>
                      {chain.start_time && chain.end_time && (
                        <Badge variant="secondary">
                          <Clock size={12} style={{ marginRight: '4px' }} />
                          {chain.start_time} - {chain.end_time}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    {assignment ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {assignment.team_members?.name?.charAt(0)}
                        </div>
                        <span style={{ color: '#f8fafc', fontSize: '14px' }}>
                          {assignment.team_members?.name} leading prayer
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>No one assigned yet</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onAssign(chain, day)}
                  >
                    {assignment ? 'Change' : 'Assign'}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
            <CalendarIcon size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No prayer chains scheduled for this day</p>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

const AssignMemberModal = ({ isOpen, onClose, chain, selectedDay, members, queryClient }) => {
  const [selectedMember, setSelectedMember] = useState('');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedMember || !chain || !selectedDay) return;
    
    setAssigning(true);
    try {
      const scheduledTime = selectedDay.toISOString();
      
      const existingAssignment = chain.prayer_chain_assignments?.find(a => {
        if (!a.scheduled_time) return false;
        return isSameDay(new Date(a.scheduled_time), selectedDay);
      });

      if (existingAssignment) {
        await supabase
          .from('prayer_chain_assignments')
          .update({ member_id: selectedMember, scheduled_time: scheduledTime })
          .eq('id', existingAssignment.id);
      } else {
        await supabase
          .from('prayer_chain_assignments')
          .insert({
            chain_id: chain.id,
            member_id: selectedMember,
            scheduled_time: scheduledTime,
            status: 'ACTIVE',
          });
      }

      queryClient.invalidateQueries(['prayer-chains']);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Prayer Leader" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Prayer Chain</p>
          <p style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '600' }}>{chain?.name}</p>
        </div>
        
        <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Date</p>
          <p style={{ color: '#f8fafc', fontSize: '16px' }}>
            {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </p>
          {chain?.start_time && (
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
              Time: {chain.start_time} - {chain.end_time}
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', color: '#f8fafc', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Select Member to Lead Prayer
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              fontSize: '14px',
            }}
          >
            <option value="">Select a member...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedMember}
            isLoading={assigning}
            style={{ flex: 1 }}
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PrayerCalendar;