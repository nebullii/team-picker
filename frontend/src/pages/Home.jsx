import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CACHE_KEY = 'team-picker-history'

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveToCache(entry) {
  const history = loadCache().filter(h => h.team_name !== entry.team_name)
  history.unshift(entry)
  localStorage.setItem(CACHE_KEY, JSON.stringify(history.slice(0, 20)))
}

function removeFromCache(teamName) {
  const history = loadCache().filter(h => h.team_name !== teamName)
  localStorage.setItem(CACHE_KEY, JSON.stringify(history))
  return history
}

function Home() {
  const location = useLocation()
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(loadCache)

  useEffect(() => {
    setAnalysis(null)
    setSelectedTeamId('')
    setError(null)
  }, [location.key])

  useEffect(() => {
    fetch(`${API_BASE}/api/teams/names`)
      .then(res => res.json())
      .then(setTeams)
      .catch(() => { })
  }, [])

  async function handleAnalyze(teamId) {
    if (!teamId) return
    setSelectedTeamId(teamId)
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: Number(teamId) }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysis(data)
      saveToCache(data)
      setHistory(loadCache())
    } catch {
      setError('Failed to get analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function getScoreColor(score) {
    if (score <= 20) return 'text-red-500'
    if (score <= 40) return 'text-orange-500'
    if (score <= 60) return 'text-yellow-500'
    if (score <= 80) return 'text-green-500'
    return 'text-emerald-500'
  }

  function getScoreBg(score) {
    if (score <= 20) return 'from-red-500 to-red-600'
    if (score <= 40) return 'from-orange-500 to-orange-600'
    if (score <= 60) return 'from-yellow-500 to-yellow-600'
    if (score <= 80) return 'from-green-500 to-green-600'
    return 'from-emerald-500 to-emerald-600'
  }

  function cleanAnalysis(text) {
    return text.split('\n').filter(line => !line.toUpperCase().includes('ROOTOMETER:')).join('\n').trim()
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Should I Root For Them?
          </h1>
          <p className="text-xl text-indigo-200 mb-10">
            Pick an NFL team. Get the truth. No sugarcoating.
          </p>

          <div className="max-w-md mx-auto">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-5 py-4 rounded-xl text-gray-900 text-lg focus:ring-4 focus:ring-indigo-300 outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="">Choose your team...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleAnalyze(selectedTeamId)}
            className="mt-6 inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-full font-medium transition-colors"
          >
            Find Out
          </button>
        </div>
      </section>

      {/* Analysis Result */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Consulting the football gods...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Score Header */}
              <div className={`bg-gradient-to-r ${getScoreBg(analysis.rootometer_score)} p-8 text-white text-center`}>
                {analysis.logo_url && (
                  <img src={analysis.logo_url} alt={analysis.team_name} className="w-20 h-20 mx-auto mb-3 drop-shadow-lg" />
                )}
                <p className="text-sm uppercase tracking-widest opacity-80 mb-1">Root-O-Meter</p>
                <p className="text-6xl font-black">{analysis.rootometer_score}</p>
                <p className="text-2xl font-bold mt-2">{analysis.team_name}</p>
                <p className="text-sm opacity-80">{analysis.team_city}</p>
              </div>

              {/* Meter Bar */}
              <div className="px-8 pt-6">
                <div className="relative">
                  <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                  <div
                    className="absolute top-0 w-1 h-4 bg-gray-900 rounded"
                    style={{ left: `${analysis.rootometer_score}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Abandon Ship</span>
                  <span>Bandwagon Approved</span>
                </div>
              </div>

              {/* Analysis Text */}
              <div className="p-8">
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                  {cleanAnalysis(analysis.analysis)}
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 pb-8 flex flex-wrap gap-3">
                <Link
                  to={`/team/${analysis.team_id}`}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Full Team Profile
                </Link>
                <Link
                  to={`/compare?team1=${analysis.team_id}`}
                  className="px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
                >
                  Compare with Another
                </Link>
              </div>
            </div>
          )}

          {!analysis && !loading && !error && history.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏈</div>
              <p className="text-gray-400 text-lg">Pick a team above to get your verdict</p>
            </div>
          )}
        </div>
      </section>

      {/* Previous Analyses */}
      {history.length > 0 && (
        <section className="py-8 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Previous Lookups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.map((h, i) => (
                <div
                  key={`${h.team_name}-${i}`}
                  className="bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow relative cursor-pointer"
                  onClick={() => setAnalysis(h)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setHistory(removeFromCache(h.team_name)) }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    x
                  </button>
                  <div className="flex items-center justify-between pr-6">
                    <div className="flex items-center gap-3">
                      {h.logo_url && (
                        <img src={h.logo_url} alt={h.team_name} className="w-10 h-10" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{h.team_name}</p>
                        <p className="text-xs text-gray-400">{h.team_city}</p>
                      </div>
                    </div>
                    <span className={`text-2xl font-black ${getScoreColor(h.rootometer_score)}`}>
                      {h.rootometer_score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {cleanAnalysis(h.analysis)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <Link to="/compare" className="text-indigo-600 hover:text-indigo-700 font-medium text-lg">
            Compare Two Teams Head-to-Head →
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
