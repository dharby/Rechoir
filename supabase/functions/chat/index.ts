import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, ...data } = await req.json()

    if (action === 'list-rooms') {
      const { teamId } = data
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return new Response(JSON.stringify({ success: true, rooms }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create-room') {
      const { name, type, teamId } = data
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({ name, type: type || 'GROUP', team_id: teamId })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, room }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'get-messages') {
      const { roomId, limit = 50, before } = data
      let query = supabase
        .from('chat_messages')
        .select('*, team_members(name, specialization)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (before) query = query.lt('created_at', before)

      const { data: messages, error } = await query
      if (error) throw error

      return new Response(JSON.stringify({ success: true, messages: messages?.reverse() || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'send-message') {
      const { roomId, senderId, senderType, content, type, fileUrl } = data
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: senderId, sender_type: senderType, content, type: type || 'TEXT', file_url: fileUrl })
        .select()
        .single()

      if (error) throw error

      const { data: sender } = await supabase
        .from('team_members')
        .select('name, specialization')
        .eq('id', senderId)
        .single()

      return new Response(JSON.stringify({ success: true, message: { ...message, team_members: sender } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'mark-read') {
      const { roomId, userId } = data
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .is('read_at', null)

      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete-message') {
      const { messageId } = data
      const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})