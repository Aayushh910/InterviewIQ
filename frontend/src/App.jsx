import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';
import { DarkParticleBackground } from './components/common/DarkParticleBackground';
import { AppRoutes } from './routes/AppRoutes';
import './styles/globals.css';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InterviewProvider>
          <BrowserRouter>
            <div className="relative min-h-screen bg-black micro-grid-bg text-white overflow-x-hidden selection:bg-white selection:text-black">
              {/* Single Global Instance of Animated Particle Background */}
              <DarkParticleBackground />
              <AppRoutes />
            </div>
          </BrowserRouter>
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

