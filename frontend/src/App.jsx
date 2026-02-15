import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TeamDetail from './pages/TeamDetail'
import Compare from './pages/Compare'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team/:id" element={<TeamDetail />} />
        <Route path="/compare" element={<Compare />} />
      </Routes>
    </Layout>
  )
}

export default App
