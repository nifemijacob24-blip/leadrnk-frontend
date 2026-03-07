import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './assets/components/Landing';
import SignupFlow from './assets/components/SignupFlow';
import Dashboard from './assets/components/Dashboard'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<SignupFlow />} />
        {/* The Dashboard is now officially mapped to the app */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;