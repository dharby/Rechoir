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
      const { teamId, startDate, endDate } = data
      let query = supabase
        .from('rehearsals')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: true })

      if (startDate) query = query.gte('date', startDate)
      if (endDate) query = query.lte('date', endDate)

      const { data: rehearsals, error } = await query

      if (error) throw error

      const rehearsalsWithAttendance = await Promise.all(
        (rehearsals || []).map(async (rehearsal: any) => {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*, team_members(id, name, email)')
            .eq('rehearsal_id', rehearsal.id)
          
          return { ...rehearsal, attendance }
        })
      )

      return new Response(
        JSON.stringify({ success: true, rehearsals: rehearsalsWithAttendance }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get') {
      const { rehearsalId } = data
      const { data: rehearsal, error } = await supabase
        .from('rehearsals')
        .select('*')
        .eq('id', rehearsalId)
        .single()

      if (error) throw error

      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, team_members(id, name, email)')
        .eq('rehearsal_id', rehearsalId)

      return new Response(
        JSON.stringify({ success: true, rehearsal: { ...rehearsal, attendance } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      const { title, date, startTime, endTime, location, agenda, teamId } = data
      const { data: rehearsal, error } = await supabase
        .from('rehearsals')
        .insert({ title, date, start_time: startTime, end_time: endTime, location, agenda, team_id: teamId })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, rehearsal }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update') {
      const { rehearsalId, title, date, startTime, endTime, location, agenda } = data
      const { data: rehearsal, error } = await supabase
        .from('rehearsals')
        .update({ title, date, start_time: startTime, end_time: endTime, location, agenda })
        .eq('id', rehearsalId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, rehearsal }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { rehearsalId } = data
      const { error } = await supabase.from('rehearsals').delete().eq('id', rehearsalId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'mark-attendance') {
      const { rehearsalId, memberId, status, arrivalTime, lateMinutes } = data
      
      const { data: rehearsal } = await supabase
        .from('rehearsals')
        .select('start_time')
        .eq('id', rehearsalId)
        .single()
      
      let punctualityScore = 100
      let calculatedLateMinutes = 0
      
      if (arrivalTime && rehearsal?.start_time) {
        const [hours, minutes] = rehearsal.start_time.split(':').map(Number)
        const scheduledStart = hours * 60 + minutes
        const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number)
        const actualArrival = arrHours * 60 + arrMinutes
        
        calculatedLateMinutes = Math.max(0, actualArrival - scheduledStart)
        
        if (calculatedLateMinutes <= 5) punctualityScore = 100
        else if (calculatedLateMinutes <= 15) punctualityScore = 80
        else if (calculatedLateMinutes <= 30) punctualityScore = 60
        else if (calculatedLateMinutes <= 60) punctualityScore = 40
        else punctualityScore = 20
      }
      
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('rehearsal_id', rehearsalId)
        .eq('member_id', memberId)
        .single()

      if (existing) {
        const { data: attendance, error } = await supabase
          .from('attendance')
          .update({ 
            status, 
            arrival_time: arrivalTime,
            sign_in_time: arrivalTime ? new Date().toISOString() : null,
            late_minutes: calculatedLateMinutes,
            punctuality_score: punctualityScore
          })
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) throw error
        return new Response(JSON.stringify({ success: true, attendance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        const { data: attendance, error } = await supabase
          .from('attendance')
          .insert({ 
            rehearsal_id: rehearsalId, 
            member_id: memberId, 
            status, 
            arrival_time: arrivalTime,
            sign_in_time: arrivalTime ? new Date().toISOString() : null,
            late_minutes: calculatedLateMinutes,
            punctuality_score: punctualityScore
          })
          .select()
          .single()
        
        if (error) throw error
        return new Response(JSON.stringify({ success: true, attendance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    if (action === 'get-stats') {
      const { teamId, memberId } = data
      
      let query = supabase
        .from('rehearsals')
        .select('id, date')
        .eq('team_id', teamId)
        .lte('date', new Date().toISOString().split('T')[0])

      const { data: rehearsals } = await query

      if (memberId) {
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('member_id', memberId)
          .in('rehearsal_id', rehearsals?.map(r => r.id) || [])

        const total = attendance?.length || 0
        const present = attendance?.filter(a => a.status === 'PRESENT').length || 0
        const excused = attendance?.filter(a => a.status === 'EXCUSED').length || 0
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            stats: { 
              total, 
              present, 
              excused, 
              absent: total - present - excused,
              rate: total > 0 ? Math.round((present / total) * 100) : 0 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(JSON.stringify({ success: true, stats: {} }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})