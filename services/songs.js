import { supabase } from './supabase';

export const songsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        song_assignments(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .order('target_readiness_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        song_assignments(
          *,
          profiles(full_name, email, specialization)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create({ title, song_key, youtube_url, practice_notes, target_readiness_date, team_id, member_ids }) {
    const { data: song, error } = await supabase
      .from('songs')
      .insert({ title, song_key, youtube_url, practice_notes, target_readiness_date, team_id })
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

    return songsService.getById(song.id);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) throw error;
  },

  async assignMember(song_id, member_id) {
    const { data, error } = await supabase
      .from('song_assignments')
      .insert({ song_id, member_id, status: 'NOT_STARTED' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAssignment(assignment_id, { status, note }) {
    const { data, error } = await supabase
      .from('song_assignments')
      .update({ status, note })
      .eq('id', assignment_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMyReadiness(song_id, member_id, { status, note }) {
    const { data, error } = await supabase
      .from('song_assignments')
      .update({ status, note })
      .eq('song_id', song_id)
      .eq('member_id', member_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeAssignment(assignment_id) {
    const { error } = await supabase.from('song_assignments').delete().eq('id', assignment_id);
    if (error) throw error;
  },

  async getWeeklyReadiness() {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

    const { data: songs, error } = await supabase
      .from('songs')
      .select(`
        *,
        song_assignments(
          *,
          profiles(id, full_name, specialization)
        )
      `)
      .lte('target_readiness_date', endOfWeek.toISOString().split('T')[0])
      .order('target_readiness_date', { ascending: true });

    if (error) throw error;

    return songs?.map(song => {
      const total = song.song_assignments?.length || 0;
      const ready = song.song_assignments?.filter(
        a => a.status === 'READY' || a.status === 'PERFECT'
      ).length || 0;
      const percentage = total > 0 ? Math.round((ready / total) * 100) : 0;

      return {
        ...song,
        stats: { ready, total, percentage },
        daysUntil: Math.ceil((new Date(song.target_readiness_date) - today) / (1000 * 60 * 60 * 24)),
        status: percentage >= 60 ? 'ON_TRACK' : percentage >= 30 ? 'AT_RISK' : 'BEHIND',
      };
    }) || [];
  },
};

export default songsService;