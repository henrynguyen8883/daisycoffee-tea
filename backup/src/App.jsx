import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import { useApp } from './context/AppContext';

function AppContent() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects are in index.css body */}
      <main className="max-w-7xl mx-auto fade-in">
        {currentUser.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
