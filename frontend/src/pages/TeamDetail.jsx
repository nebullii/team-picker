import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function TeamDetail() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
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
      })
      .catch(() => { setError('Team not found'); setLoading(false) })
  }, [id])

  function getVerdictColor(score) {
    if (score <= 20) return { text: 'text-red-600', bg: 'bg-red-500', light: 'bg-red-50' }
    if (score <= 40) return { text: 'text-orange-600', bg: 'bg-orange-500', light: 'bg-orange-50' }
    if (score <= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500', light: 'bg-yellow-50' }
    if (score <= 80) return { text: 'text-green-600', bg: 'bg-green-500', light: 'bg-green-50' }
    return { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50' }
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

  const colors = getVerdictColor(team.rootability_score)
  const winPct = team.total_appearances > 0
    ? ((team.super_bowl_wins / team.total_appearances) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-700">← Back to Search</Link>
      </nav>

      {/* Team Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{team.conference}</p>
            <h1 className="text-3xl md:text-4xl font-bold">{team.name}</h1>
            <p className="text-gray-500">{team.city}</p>
          </div>
          <div className={`mt-4 md:mt-0 px-6 py-3 rounded-xl ${colors.light}`}>
            <p className={`text-4xl font-bold text-center ${colors.text}`}>{team.rootability_score}</p>
            <p className={`text-sm font-medium text-center ${colors.text}`}>{team.verdict.label}</p>
          </div>
        </div>
      </div>

      {/* Root-O-Meter */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Root-O-Meter</h2>
        <div className="relative">
          <div className="h-8 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 overflow-hidden" />
          <div
            className="absolute top-0 w-1 h-8 bg-gray-900 rounded"
            style={{ left: `${team.rootability_score}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Abandon Ship</span>
          <span>Bandwagon Approved</span>
        </div>
        <p className="mt-4 text-gray-600 leading-relaxed italic">
          "{team.verdict.description}"
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Points */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Super Bowl Points</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-2xl font-bold text-indigo-600">{team.total_points_scored}</p>
            <p className="text-sm text-gray-500">Points Scored</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{team.total_points_allowed}</p>
            <p className="text-sm text-gray-500">Points Allowed</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${team.total_points_scored - team.total_points_allowed >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {team.total_points_scored - team.total_points_allowed > 0 ? '+' : ''}{team.total_points_scored - team.total_points_allowed}
            </p>
            <p className="text-sm text-gray-500">Point Differential</p>
          </div>
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
