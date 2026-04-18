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
      const { teamId } = data
      const { data: events, error } = await supabase
        .from('uniform_events')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: true })

      if (error) throw error

      const eventsWithReadiness = await Promise.all(
        (events || []).map(async (event: any) => {
          const { data: readiness } = await supabase
            .from('uniform_readiness')
            .select('*, team_members(id, name, email)')
            .eq('event_id', event.id)
          
          const readyCount = readiness?.filter((r: any) => r.is_ready).length || 0
          
          return { 
            ...event, 
            readiness,
            readyCount,
            totalCount: readiness?.length || 0
          }
        })
      )

      return new Response(
        JSON.stringify({ success: true, events: eventsWithReadiness }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { eventId } = data
      const { data: event, error } = await supabase
        .from('uniform_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error

      const { data: readiness } = await supabase
        .from('uniform_readiness')
        .select('*, team_members(id, name, email)')
        .eq('event_id', eventId)

      return new Response(
        JSON.stringify({ success: true, event: { ...event, readiness } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      const { name, date, description, imageUrl, teamId, memberIds } = data
      
      const { data: event, error } = await supabase
        .from('uniform_events')
        .insert({ name, date, description, image_url: imageUrl, team_id: teamId })
        .select()
        .single()

      if (error) throw error

      if (memberIds && memberIds.length > 0) {
        const readiness = memberIds.map((memberId: string) => ({
          event_id: event.id,
          member_id: memberId,
          is_ready: false
        }))
        await supabase.from('uniform_readiness').insert(readiness)
      }

      return new Response(
        JSON.stringify({ success: true, event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { eventId, name, date, description, imageUrl } = data
      const { data: event, error } = await supabase
        .from('uniform_events')
        .update({ name, date, description, image_url: imageUrl })
        .eq('id', eventId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, event }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { eventId } = data
      const { error } = await supabase.from('uniform_events').delete().eq('id', eventId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'toggle-readiness') {
      const { eventId, memberId } = data
      
      const { data: existing } = await supabase
        .from('uniform_readiness')
        .select('id, is_ready')
        .eq('event_id', eventId)
        .eq('member_id', memberId)
        .single()

      if (existing) {
        const { data: readiness, error } = await supabase
          .from('uniform_readiness')
          .update({ is_ready: !existing.is_ready })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ success: true, readiness }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        const { data: readiness, error } = await supabase
          .from('uniform_readiness')
          .insert({ event_id: eventId, member_id: memberId, is_ready: true })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ success: true, readiness }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})