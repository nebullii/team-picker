import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function TeamDetail() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [history, setHistory] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/teams/${id}`).then(r => r.json()),
      fetch(`${API_BASE}/api/teams/${id}/history`).then(r => r.json()),
    ])
      .then(([teamData, historyData]) => {
        setTeam(teamData)
        setHistory(historyData.history || [])
        setLoading(false)
        // Auto-trigger LLM analysis
        fetchAnalysis()
      })
      .catch(() => { setError('Team not found'); setLoading(false) })
  }, [id])

  async function fetchAnalysis() {
    setAnalyzing(true)
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: Number(id) }),
      })
      if (res.ok) setAnalysis(await res.json())
    } catch {
      // Analysis is supplementary, don't block on failure
    } finally {
      setAnalyzing(false)
    }
  }

  function cleanAnalysis(text) {
    return text.split('\n').filter(line => !line.toUpperCase().includes('ROOTOMETER:')).join('\n').trim()
  }

  function getScoreBg(score) {
    if (score <= 20) return 'from-red-500 to-red-600'
    if (score <= 40) return 'from-orange-500 to-orange-600'
    if (score <= 60) return 'from-yellow-500 to-yellow-600'
    if (score <= 80) return 'from-green-500 to-green-600'
    return 'from-emerald-500 to-emerald-600'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">😢</div>
        <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
        <Link to="/" className="text-indigo-600 hover:underline">Back to Home</Link>
      </div>
    )
  }

  const score = analysis ? analysis.rootometer_score : team.rootability_score
  const winPct = team.total_appearances > 0
    ? ((team.super_bowl_wins / team.total_appearances) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-700">← Back to Home</Link>
      </nav>

      {/* Team Header with Score */}
      <div className={`bg-gradient-to-r ${getScoreBg(score)} rounded-2xl p-8 text-white mb-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-80 mb-1">{team.conference}</p>
            <h1 className="text-3xl md:text-4xl font-bold">{team.name}</h1>
            <p className="opacity-80">{team.city}</p>
          </div>
          <div className="mt-4 md:mt-0 text-center">
            <p className="text-sm uppercase tracking-widest opacity-80">Root-O-Meter</p>
            <p className="text-5xl font-black">{score}</p>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="mt-6">
          <div className="relative">
            <div className="h-3 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white/60" style={{ width: `${score}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-xs opacity-60 mt-1">
            <span>Abandon Ship</span>
            <span>Bandwagon Approved</span>
          </div>
        </div>
      </div>

      {/* LLM Analysis — Primary Content */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-bold mb-4">The Verdict</h2>
        {analyzing ? (
          <div className="flex items-center space-x-3 py-8">
            <div className="animate-spin h-6 w-6 border-3 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-gray-500">Generating analysis...</p>
          </div>
        ) : analysis ? (
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
            {cleanAnalysis(analysis.analysis)}
          </div>
        ) : (
          <p className="text-gray-400 italic">Analysis unavailable.</p>
        )}
      </div>

      {/* Stats Grid — Supporting Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{team.super_bowl_wins}</p>
          <p className="text-sm text-gray-500">SB Wins</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{team.super_bowl_losses}</p>
          <p className="text-sm text-gray-500">SB Losses</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{team.total_appearances}</p>
          <p className="text-sm text-gray-500">Appearances</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{winPct}%</p>
          <p className="text-sm text-gray-500">SB Win Rate</p>
        </div>
      </div>

      {/* Super Bowl Timeline */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Super Bowl History</h2>
          <div className="space-y-3">
            {history.map((game, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  game.result === 'W' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                }`}
              >
                <div>
                  <span className={`font-bold ${game.result === 'W' ? 'text-green-700' : 'text-red-700'}`}>
                    {game.result === 'W' ? 'WON' : 'LOST'}
                  </span>
                  <span className="text-gray-600 ml-2">Super Bowl {game.game_number}</span>
                  <span className="text-gray-400 ml-2">({game.date})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{game.team_points} - {game.opponent_points}</span>
                  <span className="text-gray-500 ml-2">vs {game.opponent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compare CTA */}
      <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl border-2 border-indigo-100 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold">Compare {team.name} with another team?</h3>
            <p className="text-gray-600">See how they stack up head-to-head</p>
          </div>
          <Link
            to={`/compare?team1=${team.id}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Compare Teams
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TeamDetail
