import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Compare() {
  const [searchParams] = useSearchParams()
  const [allTeams, setAllTeams] = useState([])
  const [team1Id, setTeam1Id] = useState(searchParams.get('team1') || '')
  const [team2Id, setTeam2Id] = useState(searchParams.get('team2') || '')
  const [comparison, setComparison] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/teams/names`)
      .then(r => r.json())
      .then(setAllTeams)
  }, [])

  useEffect(() => {
    if (team1Id && team2Id && team1Id !== team2Id) {
      handleCompare()
    }
  }, [team1Id, team2Id])

  async function handleCompare() {
    if (!team1Id || !team2Id) return
    setLoading(true)
    setAnalysis(null)

    // Fetch stat comparison
    const res = await fetch(`${API_BASE}/api/compare?team1=${team1Id}&team2=${team2Id}`)
    const data = await res.json()
    setComparison(data)
    setLoading(false)

    // Fetch LLM analysis
    setAnalyzing(true)
    try {
      const llmRes = await fetch(`${API_BASE}/api/compare-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team1_id: Number(team1Id), team2_id: Number(team2Id) }),
      })
      if (llmRes.ok) setAnalysis(await llmRes.json())
    } catch {
      // Non-blocking
    } finally {
      setAnalyzing(false)
    }
  }

  function StatRow({ label, val1, val2, higherIsBetter = true }) {
    const v1 = Number(val1)
    const v2 = Number(val2)
    const t1Winner = higherIsBetter ? v1 > v2 : v1 < v2
    const t2Winner = higherIsBetter ? v2 > v1 : v2 < v1

    return (
      <div className="grid grid-cols-3 items-center py-3 border-b border-gray-100">
        <p className={`text-xl font-bold text-right ${t1Winner ? 'text-green-600' : 'text-gray-700'}`}>{val1}</p>
        <p className="text-sm text-gray-500 text-center">{label}</p>
        <p className={`text-xl font-bold ${t2Winner ? 'text-green-600' : 'text-gray-700'}`}>{val2}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-700">← Back to Home</Link>
      </nav>

      <h1 className="text-3xl font-bold mb-8 text-center">Head-to-Head Comparison</h1>

      {/* Team Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team 1</label>
          <select
            value={team1Id}
            onChange={(e) => setTeam1Id(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select a team...</option>
            {allTeams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team 2</label>
          <select
            value={team2Id}
            onChange={(e) => setTeam2Id(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select a team...</option>
            {allTeams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        </div>
      )}

      {/* LLM Analysis — Primary */}
      {(analyzing || analysis) && !loading && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">The AI Verdict</h2>
          {analyzing ? (
            <div className="flex items-center space-x-3 py-8">
              <div className="animate-spin h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
              <p className="text-gray-500">Generating head-to-head analysis...</p>
            </div>
          ) : analysis ? (
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {analysis.analysis}
            </div>
          ) : null}
        </div>
      )}

      {/* Stat Comparison — Supporting */}
      {comparison && !loading && (
        <div className="bg-white rounded-xl shadow p-6">
          {/* Team Names Header */}
          <div className="grid grid-cols-3 items-center mb-6">
            <div className="text-right">
              <Link to={`/team/${comparison.team1.id}`} className="hover:underline">
                <h2 className="text-xl font-bold">{comparison.team1.name}</h2>
                <p className="text-sm text-gray-500">{comparison.team1.city}</p>
              </Link>
            </div>
            <p className="text-center text-2xl font-bold text-gray-300">VS</p>
            <div>
              <Link to={`/team/${comparison.team2.id}`} className="hover:underline">
                <h2 className="text-xl font-bold">{comparison.team2.name}</h2>
                <p className="text-sm text-gray-500">{comparison.team2.city}</p>
              </Link>
            </div>
          </div>

          {/* Rootability Scores */}
          <div className="grid grid-cols-3 items-center py-4 mb-4 bg-gray-50 rounded-lg">
            <p className={`text-4xl font-bold text-right pr-4 ${comparison.team1.rootability_score >= comparison.team2.rootability_score ? 'text-green-600' : 'text-gray-400'}`}>
              {comparison.team1.rootability_score}
            </p>
            <p className="text-sm text-gray-500 text-center font-medium">Rootability Score</p>
            <p className={`text-4xl font-bold pl-4 ${comparison.team2.rootability_score >= comparison.team1.rootability_score ? 'text-green-600' : 'text-gray-400'}`}>
              {comparison.team2.rootability_score}
            </p>
          </div>

          {/* Stats Comparison */}
          <StatRow label="SB Wins" val1={comparison.team1.super_bowl_wins} val2={comparison.team2.super_bowl_wins} />
          <StatRow label="SB Losses" val1={comparison.team1.super_bowl_losses} val2={comparison.team2.super_bowl_losses} higherIsBetter={false} />
          <StatRow label="Appearances" val1={comparison.team1.total_appearances} val2={comparison.team2.total_appearances} />
          <StatRow label="Points Scored" val1={comparison.team1.total_points_scored} val2={comparison.team2.total_points_scored} />
          <StatRow label="Points Allowed" val1={comparison.team1.total_points_allowed} val2={comparison.team2.total_points_allowed} higherIsBetter={false} />
        </div>
      )}

      {!comparison && !loading && team1Id && team2Id && team1Id === team2Id && (
        <p className="text-center text-gray-500 py-8">Select two different teams to compare.</p>
      )}
    </div>
  )
}

export default Compare
