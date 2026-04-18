import { supabase } from '../supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const FUNCTION_URL = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;

async function callFunction(name: string, body: any) {
  const response = await fetch(FUNCTION_URL(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }
  return data;
}

// Auth - Super Admin
export const superAdminAuth = {
  register: (data: { email: string; password: string; name: string; teamName: string; phone?: string }) =>
    callFunction('auth-super-admin', { action: 'register', ...data }),
  
  login: (data: { email: string; password: string }) =>
    callFunction('auth-super-admin', { action: 'login', ...data })
};

// Auth - Team Lead
export const teamLeadAuth = {
  register: (data: { email: string; password: string; name: string; phone?: string; teamCode: string }) =>
    callFunction('auth-team-lead', { action: 'register', ...data }),
  
  login: (data: { email: string; password: string }) =>
    callFunction('auth-team-lead', { action: 'login', ...data }),
  
  setPassword: (data: { memberId: string; newPassword: string }) =>
    callFunction('auth-team-lead', { action: 'set-password', ...data }),
  
  getAccessCode: (teamId: string) =>
    callFunction('auth-team-lead', { action: 'get-access-code', teamId })
};

// Auth - Member
export const memberAuth = {
  login: (data: { email: string; accessCode: string }) =>
    callFunction('auth-member', { action: 'login', ...data }),
  
  setPassword: (data: { memberId: string; newPassword: string }) =>
    callFunction('auth-member', { action: 'set-password', ...data })
};

// Teams
export const teamsApi = {
  list: () => callFunction('teams', { action: 'list' }),
  get: (teamId: string) => callFunction('teams', { action: 'get', teamId }),
  create: (data: { name: string; superAdminId: string }) => callFunction('teams', { action: 'create', ...data }),
  update: (data: { teamId: string; name: string }) => callFunction('teams', { action: 'update', ...data }),
  delete: (teamId: string) => callFunction('teams', { action: 'delete', teamId })
};

// Members
export const membersApi = {
  list: (teamId: string, search?: string, specialization?: string) =>
    callFunction('members', { action: 'list', teamId, search, specialization }),
  
  get: (memberId: string) => callFunction('members', { action: 'get', memberId }),
  
  create: (data: { email: string; name: string; phone?: string; specialization?: string; teamId: string; accessCode: string }) =>
    callFunction('members', { action: 'create', ...data }),
  
  bulkCreate: (data: { members: any[]; teamId: string; accessCode: string }) =>
    callFunction('members', { action: 'bulk-create', ...data }),
  
  update: (data: { memberId: string; name: string; phone?: string; specialization?: string }) =>
    callFunction('members', { action: 'update', ...data }),
  
  toggleAccess: (data: { memberId: string; isActive: boolean }) =>
    callFunction('members', { action: 'toggle-access', ...data }),
  
  delete: (memberId: string) => callFunction('members', { action: 'delete', memberId })
};

// Prayer Chains
export const prayerChainsApi = {
  list: (teamId: string) => callFunction('prayer-chains', { action: 'list', teamId }),
  get: (chainId: string) => callFunction('prayer-chains', { action: 'get', chainId }),
  create: (data: { name: string; description?: string; type: string; startDate: string; endDate?: string; teamId: string }) =>
    callFunction('prayer-chains', { action: 'create', ...data }),
  update: (data: { chainId: string; name?: string; description?: string; type?: string; startDate?: string; endDate?: string }) =>
    callFunction('prayer-chains', { action: 'update', ...data }),
  delete: (chainId: string) => callFunction('prayer-chains', { action: 'delete', chainId }),
  addAssignment: (data: { chainId: string; memberId: string; scheduledTime?: string }) =>
    callFunction('prayer-chains', { action: 'add-assignment', ...data }),
  updateAssignment: (data: { assignmentId: string; scheduledTime?: string; status?: string }) =>
    callFunction('prayer-chains', { action: 'update-assignment', ...data }),
  complete: (chainId: string) => callFunction('prayer-chains', { action: 'complete', chainId })
};

// Payments
export const paymentsApi = {
  list: (teamId: string) => callFunction('payments', { action: 'list', teamId }),
  get: (paymentId: string) => callFunction('payments', { action: 'get', paymentId }),
  create: (data: { title: string; amount: number; dueDate: string; teamId: string; memberIds?: string[] }) =>
    callFunction('payments', { action: 'create', ...data }),
  update: (data: { paymentId: string; title?: string; amount?: number; dueDate?: string }) =>
    callFunction('payments', { action: 'update', ...data }),
  delete: (paymentId: string) => callFunction('payments', { action: 'delete', paymentId }),
  updateRecord: (data: { recordId: string; isPaid: boolean; paidAt?: string }) =>
    callFunction('payments', { action: 'update-record', ...data })
};

// Rehearsals
export const rehearsalsApi = {
  list: (teamId: string, startDate?: string, endDate?: string) =>
    callFunction('rehearsals', { action: 'list', teamId, startDate, endDate }),
  get: (rehearsalId: string) => callFunction('rehearsals', { action: 'get', rehearsalId }),
  create: (data: { title: string; date: string; startTime: string; endTime: string; location?: string; agenda?: string; teamId: string }) =>
    callFunction('rehearsals', { action: 'create', ...data }),
  update: (data: { rehearsalId: string; title?: string; date?: string; startTime?: string; endTime?: string; location?: string; agenda?: string }) =>
    callFunction('rehearsals', { action: 'update', ...data }),
  delete: (rehearsalId: string) => callFunction('rehearsals', { action: 'delete', rehearsalId }),
  markAttendance: (data: { rehearsalId: string; memberId: string; status: string; arrivalTime?: string }) =>
    callFunction('rehearsals', { action: 'mark-attendance', ...data }),
  getStats: (teamId: string, memberId?: string) => callFunction('rehearsals', { action: 'get-stats', teamId, memberId })
};

// Checklists
export const checklistsApi = {
  list: (teamId: string, weekStartDate?: string) =>
    callFunction('checklists', { action: 'list', teamId, weekStartDate }),
  get: (checklistId: string) => callFunction('checklists', { action: 'get', checklistId }),
  create: (data: { title: string; weekStartDate: string; teamId: string; memberIds?: string[]; items?: { description: string; memberId: string }[] }) =>
    callFunction('checklists', { action: 'create', ...data }),
  toggleItem: (itemId: string) => callFunction('checklists', { action: 'toggle-item', itemId }),
  delete: (checklistId: string) => callFunction('checklists', { action: 'delete', checklistId })
};

// Uniforms
export const uniformsApi = {
  list: (teamId: string) => callFunction('uniforms', { action: 'list', teamId }),
  get: (eventId: string) => callFunction('uniforms', { action: 'get', eventId }),
  create: (data: { name: string; date: string; description?: string; imageUrl?: string; teamId: string; memberIds?: string[] }) =>
    callFunction('uniforms', { action: 'create', ...data }),
  update: (data: { eventId: string; name?: string; date?: string; description?: string; imageUrl?: string }) =>
    callFunction('uniforms', { action: 'update', ...data }),
  delete: (eventId: string) => callFunction('uniforms', { action: 'delete', eventId }),
  toggleReadiness: (data: { eventId: string; memberId: string }) =>
    callFunction('uniforms', { action: 'toggle-readiness', ...data })
};

// Songs
export const songsApi = {
  list: (teamId: string, targetReadinessDate?: string) =>
    callFunction('songs', { action: 'list', teamId, targetReadinessDate }),
  get: (songId: string) => callFunction('songs', { action: 'get', songId }),
  create: (data: { title: string; songKey?: string; youtubeUrl?: string; practiceNotes?: string; targetReadinessDate: string; teamId: string; memberIds?: string[] }) =>
    callFunction('songs', { action: 'create', ...data }),
  update: (data: { songId: string; title?: string; songKey?: string; youtubeUrl?: string; practiceNotes?: string; targetReadinessDate?: string }) =>
    callFunction('songs', { action: 'update', ...data }),
  delete: (songId: string) => callFunction('songs', { action: 'delete', songId }),
  updateReadiness: (data: { songId: string; memberId: string; status: string; note?: string }) =>
    callFunction('songs', { action: 'update-readiness', ...data }),
  getMySongs: (memberId: string) => callFunction('songs', { action: 'get-my-songs', memberId })
};

// Chat
export const chatApi = {
  listRooms: (teamId: string) => callFunction('chat', { action: 'list-rooms', teamId }),
  createRoom: (data: { name: string; type?: string; teamId: string }) =>
    callFunction('chat', { action: 'create-room', ...data }),
  getMessages: (roomId: string, limit?: number, before?: string) =>
    callFunction('chat', { action: 'get-messages', roomId, limit, before }),
  sendMessage: (data: { roomId: string; senderId: string; senderType: string; content: string; type?: string; fileUrl?: string }) =>
    callFunction('chat', { action: 'send-message', ...data }),
  markRead: (roomId: string, userId: string) =>
    callFunction('chat', { action: 'mark-read', roomId, userId }),
  deleteMessage: (messageId: string) => callFunction('chat', { action: 'delete-message', messageId })
};

// Notifications
export const notificationsApi = {
  list: (userId: string, userType: string, limit?: number) =>
    callFunction('notifications', { action: 'list', userId, userType, limit }),
  create: (data: { userId: string; userType: string; title: string; body?: string }) =>
    callFunction('notifications', { action: 'create', ...data }),
  createBulk: (notifications: { userId: string; userType: string; title: string; body?: string }[]) =>
    callFunction('notifications', { action: 'create-bulk', notifications }),
  markRead: (notificationId: string) => callFunction('notifications', { action: 'mark-read', notificationId }),
  markAllRead: (userId: string, userType: string) =>
    callFunction('notifications', { action: 'mark-all-read', userId, userType }),
  delete: (notificationId: string) => callFunction('notifications', { action: 'delete', notificationId })
};

// Realtime subscription helper
export const subscribeToMessages = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`chat:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, callback)
    .subscribe();
};

export const unsubscribe = (channel: any) => {
  supabase.removeChannel(channel);
};