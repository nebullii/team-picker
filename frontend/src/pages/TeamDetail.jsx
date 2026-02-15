import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = '/api'

function TeamDetail() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeamData()
  }, [id])

  async function fetchTeamData() {
    setLoading(true)
    setError(null)
    try {
      const [teamRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/teams/${id}`),
        fetch(`${API_BASE}/teams/${id}/history`)
      ])

      if (!teamRes.ok) {
        throw new Error('Team not found')
      }

      const teamData = await teamRes.json()
      setTeam(teamData)

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setHistory(historyData.seasons || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getVerdictColor(score) {
    if (score <= 20) return { text: 'text-red-600', bg: 'bg-red-500', light: 'bg-red-50' }
    if (score <= 40) return { text: 'text-orange-600', bg: 'bg-orange-500', light: 'bg-orange-50' }
    if (score <= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500', light: 'bg-yellow-50' }
    if (score <= 80) return { text: 'text-green-600', bg: 'bg-green-500', light: 'bg-green-50' }
    return { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50' }
  }

  function getVerdictLabel(score) {
    if (score <= 20) return 'Abandon Ship'
    if (score <= 40) return 'Proceed with Caution'
    if (score <= 60) return 'Solid Pick'
    if (score <= 80) return 'Great Choice'
    return 'Bandwagon Approved'
  }

  function getVerdictMessage(team) {
    const score = team.rootability_score
    const winRate = (team.total_wins / (team.total_wins + team.total_losses)) * 100
    
    if (score <= 20) {
      return `Look, we won't tell you how to live your life, but ${team.name} fans have seen things. Dark things. This team has a ${winRate.toFixed(1)}% all-time win rate and it shows. Maybe pick up a hobby instead?`
    }
    if (score <= 40) {
      return `${team.city} ${team.name}? Bold choice. They're not terrible, but they're not great either. You'll have moments of hope followed by the familiar feeling of disappointment. Proceed at your own risk.`
    }
    if (score <= 60) {
      return `The ${team.name} are a respectable franchise. They've had their ups and downs, but who hasn't? With ${team.championships} championship(s) and a solid fan base, you could definitely do worse. Welcome aboard!`
    }
    if (score <= 80) {
      return `Now we're talking! The ${team.name} know how to win. With a ${winRate.toFixed(1)}% win rate and ${team.championships} championship(s), you'll have plenty of happy Sundays (or whatever day they play). Great pick!`
    }
    return `Congratulations! You've selected a certified winner. The ${team.city} ${team.name} are the cream of the crop. Bandwagon? Maybe. Smart? Absolutely. Enjoy all those parade routes!`
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">😢</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Not Found</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    )
  }

  const colors = getVerdictColor(team.rootability_score)
  const winRate = (team.total_wins / (team.total_wins + team.total_losses)) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700">
          ← Back to Search
        </Link>
      </nav>

      {/* Team Header */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{team.league}</p>
            <h1 className="text-3xl md:text-4xl font-bold">{team.city} {team.name}</h1>
            <p className="text-gray-600 mt-1">{team.conference} • {team.division}</p>
          </div>
          <div className={`mt-4 md:mt-0 px-6 py-3 rounded-xl ${colors.light}`}>
            <div className="text-center">
              <p className={`text-4xl font-bold ${colors.text}`}>{team.rootability_score}</p>
              <p className={`text-sm font-medium ${colors.text}`}>{getVerdictLabel(team.rootability_score)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Root-O-Meter */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">🎯 Root-O-Meter</h2>
        <div className="relative">
          <div className="h-8 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-between px-4 text-white text-sm font-medium">
              <span>Abandon Ship</span>
              <span>Bandwagon Approved</span>
            </div>
          </div>
          <div 
            className="absolute top-0 w-1 h-8 bg-gray-900 shadow-lg transition-all duration-500"
            style={{ left: `${team.rootability_score}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <p className="mt-4 text-gray-600 leading-relaxed">
          {getVerdictMessage(team)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{team.total_wins}</p>
          <p className="text-sm text-gray-500">Total Wins</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-500">{team.total_losses}</p>
          <p className="text-sm text-gray-500">Total Losses</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{team.championships}</p>
          <p className="text-sm text-gray-500">Championships</p>
        </div>
        <div className="card text-center">
          <p className={`text-3xl font-bold ${team.current_streak >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {team.current_streak >= 0 ? `W${team.current_streak}` : `L${Math.abs(team.current_streak)}`}
          </p>
          <p className="text-sm text-gray-500">Current Streak</p>
        </div>
      </div>

      {/* Win Rate Progress */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">📈 All-Time Win Rate</h2>
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <p className="mt-2 text-center text-2xl font-bold">{winRate.toFixed(1)}%</p>
      </div>

      {/* Historical Trend Chart */}
      {history.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Last {history.length} Seasons</h2>
          <div className="h-48 flex items-end space-x-2">
            {history.map((season, index) => {
              const winPct = (season.wins / (season.wins + season.losses)) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${
                      winPct >= 50 ? 'bg-green-500' : 'bg-red-400'
                    }`}
                    style={{ height: `${Math.max(winPct, 5)}%` }}
                    title={`${season.season}: ${season.wins}-${season.losses} (${winPct.toFixed(0)}%)`}
                  />
                  <p className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {season.season.slice(2)}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <span>🔴 Below .500</span>
            <span>🟢 .500 or better</span>
          </div>
        </div>
      )}

      {/* Compare CTA */}
      <div className="card bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-100">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h3 className="text-lg font-bold">Want to compare {team.name} with another team?</h3>
            <p className="text-gray-600">See how they stack up head-to-head</p>
          </div>
          <Link
            to={`/compare?team1=${team.id}`}
            className="btn-primary"
          >
            Compare Teams
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TeamDetail
