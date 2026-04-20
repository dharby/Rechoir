import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iuppnzkqkosrzmeauysc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cHBuemtxa29zcnptZWF1eXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTQwNDUsImV4cCI6MjA5MTY3MDA0NX0.zkX9UmW8-ChlPwz8O1uQcQEXeRLG_VAsWeKgvWK2Igk';

const FUNCTION_URL = (name) => `${SUPABASE_URL}/functions/v1/${name}`;

async function callFunction(name, body) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  console.log(`Calling function ${name}:`, body);
  
  const response = await fetch(FUNCTION_URL(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  console.log(`Function ${name} response:`, data);
  
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  return data;
}

// Auth - Super Admin
export const superAdminAuth = {
  register: (data) => callFunction('auth-super-admin', { action: 'register', ...data }),
  login: (data) => callFunction('auth-super-admin', { action: 'login', ...data })
};

// Auth - Team Lead
export const teamLeadAuth = {
  register: (data) => callFunction('auth-team-lead', { action: 'register', ...data }),
  login: (data) => callFunction('auth-team-lead', { action: 'login', ...data }),
  setPassword: (data) => callFunction('auth-team-lead', { action: 'set-password', ...data }),
  changePassword: (data) => callFunction('auth-team-lead', { action: 'change-password', ...data }),
  getAccessCode: (teamId) => callFunction('auth-team-lead', { action: 'get-access-code', teamId })
};

// Auth - Member
export const memberAuth = {
  login: (data) => callFunction('auth-member', { action: 'login', ...data }),
  setPassword: (data) => callFunction('auth-member', { action: 'set-password', ...data })
};

// Teams
export const teamsApi = {
  list: () => callFunction('teams', { action: 'list' }),
  get: (teamId) => callFunction('teams', { action: 'get', teamId }),
  create: (data) => callFunction('teams', { action: 'create', ...data }),
  update: (data) => callFunction('teams', { action: 'update', ...data }),
  delete: (teamId) => callFunction('teams', { action: 'delete', teamId })
};

// Members
export const membersApi = {
  list: (teamId, search, specialization) => callFunction('members', { action: 'list', teamId, search, specialization }),
  get: (memberId) => callFunction('members', { action: 'get', memberId }),
  create: (data) => callFunction('members', { action: 'create', ...data }),
  bulkCreate: (data) => callFunction('members', { action: 'bulk-create', ...data }),
  update: (data) => callFunction('members', { action: 'update', ...data }),
  toggleAccess: (data) => callFunction('members', { action: 'toggle-access', ...data }),
  delete: (memberId) => callFunction('members', { action: 'delete', memberId })
};

// Prayer Chains
export const prayerChainsApi = {
  list: (teamId) => callFunction('prayer-chains', { action: 'list', teamId }),
  get: (chainId) => callFunction('prayer-chains', { action: 'get', chainId }),
  create: (data) => callFunction('prayer-chains', { action: 'create', ...data }),
  update: (data) => callFunction('prayer-chains', { action: 'update', ...data }),
  delete: (chainId) => callFunction('prayer-chains', { action: 'delete', chainId }),
  addAssignment: (data) => callFunction('prayer-chains', { action: 'add-assignment', ...data }),
  updateAssignment: (data) => callFunction('prayer-chains', { action: 'update-assignment', ...data }),
  complete: (chainId) => callFunction('prayer-chains', { action: 'complete', chainId })
};

// Payments
export const paymentsApi = {
  list: (teamId) => callFunction('payments', { action: 'list', teamId }),
  get: (paymentId) => callFunction('payments', { action: 'get', paymentId }),
  create: (data) => callFunction('payments', { action: 'create', ...data }),
  update: (data) => callFunction('payments', { action: 'update', ...data }),
  delete: (paymentId) => callFunction('payments', { action: 'delete', paymentId }),
  updateRecord: (data) => callFunction('payments', { action: 'update-record', ...data })
};

// Rehearsals
export const rehearsalsApi = {
  list: (teamId, startDate, endDate) => callFunction('rehearsals', { action: 'list', teamId, startDate, endDate }),
  get: (rehearsalId) => callFunction('rehearsals', { action: 'get', rehearsalId }),
  create: (data) => callFunction('rehearsals', { action: 'create', ...data }),
  update: (data) => callFunction('rehearsals', { action: 'update', ...data }),
  delete: (rehearsalId) => callFunction('rehearsals', { action: 'delete', rehearsalId }),
  markAttendance: (data) => callFunction('rehearsals', { action: 'mark-attendance', ...data }),
  getStats: (teamId, memberId) => callFunction('rehearsals', { action: 'get-stats', teamId, memberId })
};

// Checklists
export const checklistsApi = {
  list: (teamId, weekStartDate) => callFunction('checklists', { action: 'list', teamId, weekStartDate }),
  get: (checklistId) => callFunction('checklists', { action: 'get', checklistId }),
  create: (data) => callFunction('checklists', { action: 'create', ...data }),
  toggleItem: (itemId) => callFunction('checklists', { action: 'toggle-item', itemId }),
  delete: (checklistId) => callFunction('checklists', { action: 'delete', checklistId })
};

// Uniforms
export const uniformsApi = {
  list: (teamId) => callFunction('uniforms', { action: 'list', teamId }),
  get: (eventId) => callFunction('uniforms', { action: 'get', eventId }),
  create: (data) => callFunction('uniforms', { action: 'create', ...data }),
  update: (data) => callFunction('uniforms', { action: 'update', ...data }),
  delete: (eventId) => callFunction('uniforms', { action: 'delete', eventId }),
  toggleReadiness: (data) => callFunction('uniforms', { action: 'toggle-readiness', ...data })
};

// Songs
export const songsApi = {
  list: (teamId, targetReadinessDate) => callFunction('songs', { action: 'list', teamId, targetReadinessDate }),
  get: (songId) => callFunction('songs', { action: 'get', songId }),
  create: (data) => callFunction('songs', { action: 'create', ...data }),
  update: (data) => callFunction('songs', { action: 'update', ...data }),
  delete: (songId) => callFunction('songs', { action: 'delete', songId }),
  updateReadiness: (data) => callFunction('songs', { action: 'update-readiness', ...data }),
  getMySongs: (memberId) => callFunction('songs', { action: 'get-my-songs', memberId })
};

// Chat
export const chatApi = {
  listRooms: (teamId) => callFunction('chat', { action: 'list-rooms', teamId }),
  createRoom: (data) => callFunction('chat', { action: 'create-room', ...data }),
  getMessages: (roomId, limit, before) => callFunction('chat', { action: 'get-messages', roomId, limit, before }),
  sendMessage: (data) => callFunction('chat', { action: 'send-message', ...data }),
  markRead: (roomId, userId) => callFunction('chat', { action: 'mark-read', roomId, userId }),
  deleteMessage: (messageId) => callFunction('chat', { action: 'delete-message', messageId })
};

// Notifications
export const notificationsApi = {
  list: (userId, userType, limit) => callFunction('notifications', { action: 'list', userId, userType, limit }),
  create: (data) => callFunction('notifications', { action: 'create', ...data }),
  createBulk: (notifications) => callFunction('notifications', { action: 'create-bulk', notifications }),
  markRead: (notificationId) => callFunction('notifications', { action: 'mark-read', notificationId }),
  markAllRead: (userId, userType) => callFunction('notifications', { action: 'mark-all-read', userId, userType }),
  delete: (notificationId) => callFunction('notifications', { action: 'delete', notificationId }),
  broadcast: (teamId, title, body, senderId) => callFunction('notifications', { action: 'broadcast', teamId, title, body, senderId })
};

// Realtime subscription helper
export const subscribeToMessages = (roomId, callback) => {
  return supabase
    .channel(`chat:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, callback)
    .subscribe();
};

export const unsubscribe = (channel) => {
  supabase.removeChannel(channel);
};