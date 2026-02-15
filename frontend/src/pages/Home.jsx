import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = '/api'

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState([])
  const [featuredTeams, setFeaturedTeams] = useState([])
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      const [teamsRes, leaguesRes] = await Promise.all([
        fetch(`${API_BASE}/teams?limit=6`),
        fetch(`${API_BASE}/leagues`)
      ])
      
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setFeaturedTeams(teamsData.teams || [])
      }
      
      if (leaguesRes.ok) {
        const leaguesData = await leaguesRes.json()
        setLeagues(leaguesData.leagues || [])
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim() && !selectedLeague) {
      setTeams([])
      return
    }

    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      if (selectedLeague) params.append('league', selectedLeague)

      const response = await fetch(`${API_BASE}/teams?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  async function handleRandomTeam() {
    try {
      const response = await fetch(`${API_BASE}/teams/random`)
      if (response.ok) {
        const team = await response.json()
        navigate(`/team/${team.id}`)
      }
    } catch (error) {
      console.error('Failed to get random team:', error)
    }
  }

  function getVerdictColor(score) {
    if (score <= 20) return 'text-red-600 bg-red-50'
    if (score <= 40) return 'text-orange-600 bg-orange-50'
    if (score <= 60) return 'text-yellow-600 bg-yellow-50'
    if (score <= 80) return 'text-green-600 bg-green-50'
    return 'text-emerald-600 bg-emerald-50'
  }

  function getVerdictLabel(score) {
    if (score <= 20) return 'Abandon Ship'
    if (score <= 40) return 'Proceed with Caution'
    if (score <= 60) return 'Solid Pick'
    if (score <= 80) return 'Great Choice'
    return 'Bandwagon Approved'
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Should You Root For Them?
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Get a data-driven verdict on whether a sports team is worth your emotional investment
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams by name or city..."
                  className="w-full px-5 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-primary-300 outline-none text-lg"
                />
              </div>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="px-4 py-4 rounded-xl text-gray-900 bg-white focus:ring-4 focus:ring-primary-300 outline-none"
              >
                <option value="">All Leagues</option>
                {leagues.map((league) => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-4 bg-accent-500 hover:bg-accent-600 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Random Team Button */}
          <button
            onClick={handleRandomTeam}
            className="mt-6 inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full transition-colors"
          >
            <span className="text-xl">🎲</span>
            <span className="font-medium">Pick a Random Team</span>
          </button>
        </div>
      </section>

      {/* Search Results */}
      {teams.length > 0 && (
        <section className="py-12 px-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/team/${team.id}`}
                  className="card hover:scale-105 transition-transform"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">{team.league}</p>
                      <h3 className="text-xl font-bold">{team.city} {team.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(team.rootability_score)}`}>
                      {team.rootability_score}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Win Rate: {((team.total_wins / (team.total_wins + team.total_losses)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{getVerdictLabel(team.rootability_score)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Teams */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Teams</h2>
            <Link
              to="/compare"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Compare Teams →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTeams.map((team) => (
                <Link
                  key={team.id}
                  to={`/team/${team.id}`}
                  className="card hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide">{team.league}</p>
                      <h3 className="text-xl font-bold">{team.city} {team.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(team.rootability_score)}`}>
                      {team.rootability_score}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      Win Rate: {((team.total_wins / (team.total_wins + team.total_losses)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-gray-600">
                      Championships: {team.championships}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">{getVerdictLabel(team.rootability_score)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Search Any Team</h3>
              <p className="text-gray-600">
                Find teams across NFL, NBA, MLB, NHL, and major soccer leagues
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Analyze the Data</h3>
              <p className="text-gray-600">
                We crunch the numbers on wins, championships, and trends
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Get Your Verdict</h3>
              <p className="text-gray-600">
                Discover if they're worth your heart and soul
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
