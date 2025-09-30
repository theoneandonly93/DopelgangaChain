import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'

export async function GET() {
  try {
    // Leaderboard totals
    const { data: totals, error: totalsErr } = await supabase
      .from('validator_leaderboard')
      .select('validator, total_rewards')
    if (totalsErr) throw totalsErr

    // Latest reward timestamps (sampled)
    const { data: latest, error: latestErr } = await supabase
      .from('validator_rewards')
      .select('validator, timestamp')
      .order('timestamp', { ascending: false })
      .limit(1000)
    if (latestErr) throw latestErr

    // Recent rewards participation window
    const windowSize = 500
    const { data: recent, error: recentErr } = await supabase
      .from('validator_rewards')
      .select('validator')
      .order('id', { ascending: false })
      .limit(windowSize)
    if (recentErr) throw recentErr

    const now = Date.now()
    const lastTsByVal = new Map<string, number>()
    for (const r of latest || []) {
      const v = String((r as any).validator)
      const t = Number((r as any).timestamp || 0)
      if (!lastTsByVal.has(v)) lastTsByVal.set(v, t)
    }

    const counts = new Map<string, number>()
    for (const r of recent || []) {
      const v = String((r as any).validator)
      counts.set(v, (counts.get(v) || 0) + 1)
    }

    const list = (totals || []).map((row: any) => {
      const validator = String(row.validator)
      const totalRewards = Number(row.total_rewards || 0)
      const lastRewardTs = Number(lastTsByVal.get(validator) || 0)
      const active = lastRewardTs > 0 && now - lastRewardTs < 24 * 60 * 60 * 1000 // 24h
      const participation = windowSize > 0 ? Math.round(((counts.get(validator) || 0) / windowSize) * 100) : 0
      return {
        validator,
        totalRewards,
        lastRewardTs,
        active,
        participation,
        commission: null,
        staked: null,
      }
    })

    return NextResponse.json({ count: list.length, validators: list })
  } catch (err) {
    console.error('API /validators error:', err)
    return NextResponse.json({ error: 'Failed to fetch validators' }, { status: 500 })
  }
}

