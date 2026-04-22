import { supabase } from './supabase';

// Unified Auth - Team Lead is the admin for their choir
export const superAdminAuth = teamLeadAuth;

export const teamLeadAuth = {
  login: async (data) => {
    const { email, password } = data;
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    const { data: profile } = await supabase
      .from('team_leads')
      .select('*, teams(*)')
      .eq('id', authData.user.id)
      .single();
    
    return { 
      success: true, 
      user: { ...profile, role: 'TEAM_LEAD' },
      token: authData.session.access_token,
      team: profile?.teams
    };
  },
  
  register: async (data) => {
    const { email, password, name, phone, teamCode } = data;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    if (!authData.user) {
      return { success: false, error: 'Registration failed' };
    }
    
    // Check if team exists, if not create it
    let { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('code', teamCode)
      .single();
    
    if (!team) {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({ name: `${name}'s Choir`, code: teamCode })
        .select()
        .single();
      
      if (teamError) {
        return { success: false, error: teamError.message };
      }
      team = newTeam;
    }
    
    // Create team lead profile
    const { error: profileError } = await supabase
      .from('team_leads')
      .insert({
        id: authData.user.id,
        name,
        phone,
        email,
        team_id: team.id
      });
    
    if (profileError) {
      return { success: false, error: profileError.message };
    }
    
    return { success: true, user: { id: authData.user.id, email, name, role: 'TEAM_LEAD' }, team };
  }
};

export const memberAuth = {
  login: async (data) => {
    const { accessCode, email, password } = data;
    
    if (email && password) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!authError && authData.user) {
        const { data: member } = await supabase
          .from('members')
          .select('*, teams(*)')
          .eq('id', authData.user.id)
          .single();
        
        return { 
          success: true, 
          user: { ...member, role: 'MEMBER' },
          token: authData.session.access_token,
          team: member?.teams
        };
      }
    }
    
    if (accessCode) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*, teams(*)')
        .eq('access_code', accessCode)
        .single();
      
      if (memberError || !member) {
        return { success: false, error: 'Invalid access code' };
      }
      
      return { 
        success: true, 
        user: { ...member, role: 'MEMBER' },
        team: member.teams
      };
    }
    
    return { success: false, error: 'Invalid credentials' };
  }
};

// Teams API
export const teamsApi = {
  list: async () => {
    const { data, error } = await supabase.from('teams').select('*');
    if (error) throw error;
    return data;
  },
  get: async (teamId) => {
    const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (error) throw error;
    return data;
  },
  create: async (data) => {
    const { data: result, error } = await supabase.from('teams').insert(data).select().single();
    if (error) throw error;
    return result;
  }
};

// Members API
export const membersApi = {
  list: async (teamId, search) => {
    let query = supabase.from('members').select('*, teams(*), specializations(*)').eq('team_id', teamId);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  get: async (memberId) => {
    const { data, error } = await supabase.from('members').select('*, teams(*)').eq('id', memberId).single();
    if (error) throw error;
    return data;
  },
  create: async (data) => {
    const { data: result, error } = await supabase.from('members').insert(data).select().single();
    if (error) throw error;
    return result;
  },
  update: async (data) => {
    const { data: result, error } = await supabase.from('members').update(data).eq('id', data.id).select().single();
    if (error) throw error;
    return result;
  }
};

// Placeholder APIs
export const prayerChainsApi = { list: () => [], get: () => null, create: () => null, update: () => null, delete: () => null };
export const paymentsApi = { list: () => [], get: () => null, create: () => null, update: () => null, delete: () => null };
export const rehearsalsApi = { list: () => [], get: () => null, create: () => null, update: () => null, delete: () => null, markAttendance: () => null };
export const checklistsApi = { list: () => [], get: () => null, create: () => null, toggleItem: () => null, delete: () => null };
export const uniformsApi = { list: () => [], get: () => null, create: () => null, update: () => null, delete: () => null };
export const songsApi = { list: () => [], get: () => null, create: () => null, update: () => null, delete: () => null };
export const chatApi = { listRooms: () => [], getMessages: () => [], sendMessage: () => null };
export const notificationsApi = { list: () => [], create: () => null };

export const subscribeToMessages = (roomId, callback) => {
  return supabase
    .channel(`chat:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, callback)
    .subscribe();
};

export const unsubscribe = (channel) => {
  supabase.removeChannel(channel);
};