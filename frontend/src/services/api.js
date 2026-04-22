import { supabase } from './supabase';

const FUNCTION_URL = (name) => `https://iuppnzkqkosrzmeauysc.supabase.co/functions/v1/${name}`;

async function callFunction(name, body) {
  const response = await fetch(FUNCTION_URL(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cHBuemtxa29zcnptZWF1eXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTQwNDUsImV4cCI6MjA5MTY3MDA0NX0.zkX9UmW8-ChlPwz8O1uQcQEXeRLG_VAsWeKgvWK2Igk'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  return data;
}

// Direct Supabase Auth - no functions needed
export const superAdminAuth = {
  login: async (data) => {
    const { email, password } = data;
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('super_admins')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    return { 
      success: true, 
      user: profile || { id: authData.user.id, email: authData.user.email, role: 'SUPER_ADMIN' },
      token: authData.session.access_token
    };
  }
};

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
    
    // Get team lead profile
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
    
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    // Get team
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('code', teamCode)
      .single();
    
    if (!team) {
      return { success: false, error: 'Invalid team code' };
    }
    
    // Create team lead profile
    const { data: profile, error: profileError } = await supabase
      .from('team_leads')
      .insert({
        id: authData.user.id,
        name,
        phone,
        team_id: team.id
      })
      .select()
      .single();
    
    if (profileError) {
      return { success: false, error: profileError.message };
    }
    
    return { success: true, user: { ...profile, role: 'TEAM_LEAD' }, team };
  }
};

export const memberAuth = {
  login: async (data) => {
    const { code, password } = data;
    
    // Find member by code
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*, teams(*), specializations(*)')
      .eq('access_code', code)
      .single();
    
    if (memberError || !member) {
      return { success: false, error: 'Invalid access code' };
    }
    
    // Check if password is set, if not this is first login
    if (!member.password_hash) {
      return { success: false, error: 'PASSWORD_NOT_SET', needsPassword: true, member };
    }
    
    // For now, accept the code as password for simple auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: member.email,
      password: password || code
    });
    
    if (authError) {
      return { success: false, error: authError.message };
    }
    
    return { 
      success: true, 
      user: { ...member, role: 'MEMBER' },
      token: authData.session.access_token,
      team: member.teams
    };
  }
};

// Teams - direct Supabase
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

// Members - direct Supabase
export const membersApi = {
  list: async (teamId, search) => {
    let query = supabase.from('members').select('*, teams(*), specializations(*)').eq('team_id', teamId);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

// Placeholder for other APIs - they'll need functions or direct DB access
export const prayerChainsApi = { list: () => [], create: () => {} };
export const paymentsApi = { list: () => [], create: () => {} };
export const rehearsalsApi = { list: () => [], create: () => {} };
export const checklistsApi = { list: () => [], create: () => {} };
export const uniformsApi = { list: () => [], create: () => {} };
export const songsApi = { list: () => [], create: () => {} };
export const chatApi = { listRooms: () => [], sendMessage: () => {} };
export const notificationsApi = { list: () => [], create: () => {} };

export const subscribeToMessages = (roomId, callback) => {
  return supabase
    .channel(`chat:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, callback)
    .subscribe();
};

export const unsubscribe = (channel) => {
  supabase.removeChannel(channel);
};