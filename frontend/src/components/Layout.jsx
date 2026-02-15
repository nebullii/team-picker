import { Link, NavLink } from 'react-router-dom'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-xl tracking-tight">Team Picker</span>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-primary-100 hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-primary-100 hover:text-white'
                  }`
                }
              >
                Compare Teams
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-xl">🏆</span>
              <span className="font-semibold">Team Picker</span>
            </div>
            <p className="text-sm text-gray-400">
              Making sports fandom decisions easier since 2024
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-sm text-gray-500">
            For entertainment purposes only. Your team loyalty is your own responsibility.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
