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
      const { teamId, targetReadinessDate } = data
      let query = supabase
        .from('songs')
        .select('*')
        .eq('team_id', teamId)
        .order('target_readiness_date', { ascending: true })

      if (targetReadinessDate) query = query.eq('target_readiness_date', targetReadinessDate)

      const { data: songs, error } = await query
      if (error) throw error

      const songsWithAssignments = await Promise.all(
        (songs || []).map(async (song: any) => {
          const { data: assignments } = await supabase
            .from('song_assignments')
            .select('*, team_members(id, name, email)')
            .eq('song_id', song.id)

          const readyCount = assignments?.filter((a: any) => a.status === 'READY' || a.status === 'PERFECT').length || 0

          return {
            ...song,
            assignments,
            readyCount: readyCount,
            totalCount: assignments?.length || 0,
            progress: assignments?.length ? Math.round((readyCount / assignments.length) * 100) : 0
          }
        })
      )

      return new Response(
        JSON.stringify({ success: true, songs: songsWithAssignments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { songId } = data
      const { data: song, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

      if (error) throw error

      const { data: assignments } = await supabase
        .from('song_assignments')
        .select('*, team_members(id, name, email)')
        .eq('song_id', songId)

      return new Response(
        JSON.stringify({ success: true, song: { ...song, assignments } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      const { title, songKey, youtubeUrl, practiceNotes, targetReadinessDate, teamId, memberIds } = data

      const { data: song, error } = await supabase
        .from('songs')
        .insert({ title, song_key: songKey, youtube_url: youtubeUrl, practice_notes: practiceNotes, target_readiness_date: targetReadinessDate, team_id: teamId })
        .select()
        .single()

      if (error) throw error

      if (memberIds && memberIds.length > 0) {
        const assignments = memberIds.map((memberId: string) => ({
          song_id: song.id,
          member_id: memberId,
          status: 'NOT_STARTED'
        }))
        await supabase.from('song_assignments').insert(assignments)
      }

      return new Response(
        JSON.stringify({ success: true, song }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      const { songId, title, songKey, youtubeUrl, practiceNotes, targetReadinessDate } = data
      const { data: song, error } = await supabase
        .from('songs')
        .update({ title, song_key: songKey, youtube_url: youtubeUrl, practice_notes: practiceNotes, target_readiness_date: targetReadinessDate })
        .eq('id', songId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, song }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { songId } = data
      const { error } = await supabase.from('songs').delete().eq('id', songId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-readiness') {
      const { songId, memberId, status, note } = data

      const { data: existing } = await supabase
        .from('song_assignments')
        .select('id')
        .eq('song_id', songId)
        .eq('member_id', memberId)
        .single()

      if (existing) {
        const { data: assignment, error } = await supabase
          .from('song_assignments')
          .update({ status, note, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ success: true, assignment }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        const { data: assignment, error } = await supabase
          .from('song_assignments')
          .insert({ song_id: songId, member_id: memberId, status, note })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ success: true, assignment }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    if (action === 'get-my-songs') {
      const { memberId } = data
      const { data: assignments } = await supabase
        .from('song_assignments')
        .select('*, songs(*)')
        .eq('member_id', memberId)

      return new Response(
        JSON.stringify({ success: true, songs: assignments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})