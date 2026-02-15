import { Link, NavLink } from 'react-router-dom'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏈</span>
              <span className="font-bold text-xl tracking-tight">Team Picker</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-white' : 'text-indigo-200 hover:text-white'}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-white' : 'text-indigo-200 hover:text-white'}`
                }
              >
                Compare
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            Built with Super Bowl data. For entertainment purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
