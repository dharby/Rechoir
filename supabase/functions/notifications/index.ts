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

    if (action === 'list') {
      const { userId, userType, limit = 20 } = data
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0
      return new Response(JSON.stringify({ success: true, notifications, unreadCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create') {
      const { userId, userType, title, body } = data
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, user_type: userType, title, body })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, notification }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create-bulk') {
      const { notifications } = data
      const { data: created, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, count: created?.length || 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'mark-read') {
      const { notificationId } = data
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'mark-all-read') {
      const { userId, userType } = data
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('is_read', false)

      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { notificationId } = data
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'broadcast') {
      const { teamId, title, body, senderId } = data
      
      const { data: members } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('is_active', true)
      
      if (members && members.length > 0) {
        const notifications = members.map(m => ({
          user_id: m.id,
          user_type: 'MEMBER',
          title,
          body,
          is_broadcast: true,
          priority: 'urgent',
        }))
        
        const { error } = await supabase.from('notifications').insert(notifications)
        if (error) throw error
      }
      
      return new Response(JSON.stringify({ success: true, count: members?.length || 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})