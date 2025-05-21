import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Test from './test/test';
import FormBuilder from './pages/FormBuilder';
import { FormProvider } from './context/FormContext/FormProvider';

function AppRoutes() {
  return (
    <Routes>
      {/* Dashboard as the root page */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/form-builder" element={
        <FormProvider>
          <FormBuilder />
        </FormProvider>
      } />
      <Route path="/test" element={<Test />} /> 
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;