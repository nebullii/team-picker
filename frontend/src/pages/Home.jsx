import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API_BASE}/api/teams`)
      .then(res => res.json())
      .then(data => { setTeams(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    const params = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery)}` : ''
    const res = await fetch(`${API_BASE}/api/teams${params}`)
    setTeams(await res.json())
    setLoading(false)
  }

  async function handleRandomTeam() {
    const res = await fetch(`${API_BASE}/api/teams/random`)
    const team = await res.json()
    navigate(`/team/${team.id}`)
  }

  function getVerdictColor(score) {
    if (score <= 20) return 'text-red-600 bg-red-50 border-red-200'
    if (score <= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (score <= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score <= 80) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Should You Root For Them?
          </h1>
          <p className="text-xl text-indigo-200 mb-8">
            A data-driven verdict on NFL teams based on Super Bowl history
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team name or city..."
              className="flex-1 px-5 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-300 outline-none text-lg"
            />
            <button
              type="submit"
              className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-colors"
            >
              Search
            </button>
          </form>

          <button
            onClick={handleRandomTeam}
            className="mt-6 inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full transition-colors"
          >
            <span className="text-xl">🎲</span>
            <span className="font-medium">Pick a Random Team</span>
          </button>
        </div>
      </section>

      {/* Teams Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {searchQuery ? 'Search Results' : 'All Teams — Ranked by Rootability'}
            </h2>
            <Link to="/compare" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Compare Teams →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : teams.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No teams found. Try a different search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <Link
                  key={team.id}
                  to={`/team/${team.id}`}
                  className="bg-white rounded-xl shadow hover:shadow-lg p-6 transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">{team.conference}</p>
                      <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.city}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getVerdictColor(team.rootability_score)}`}>
                      {team.rootability_score}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Super Bowls: {team.super_bowl_wins}W - {team.super_bowl_losses}L ({team.total_appearances} appearances)</p>
                  </div>
                  <p className="mt-3 text-sm font-medium" style={{ color: team.rootability_score > 60 ? '#059669' : team.rootability_score > 40 ? '#d97706' : '#dc2626' }}>
                    {team.verdict.label}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Search Any NFL Team</h3>
              <p className="text-gray-600">Find teams by name or city</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Analyze Super Bowl History</h3>
              <p className="text-gray-600">We crunch wins, losses, margins, and appearances</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Get Your Verdict</h3>
              <p className="text-gray-600">From "Abandon Ship" to "Bandwagon Approved"</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
