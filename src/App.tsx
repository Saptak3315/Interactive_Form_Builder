import './App.css'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import FormsDashboard from './components/FormsDashboard/FormsDashboard'
import Test from './test/test'

function AppRoutes() {
  return (
    <Routes>
      {/* Dashboard as the root page */}
      <Route path="/" element={<FormsDashboard/>} />
      <Route path="/test" element={<Test />} />
      
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes/>
    </BrowserRouter>
  )
}

export default App