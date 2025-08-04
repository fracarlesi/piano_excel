import React from 'react';
import BankPlanApp from './features/financial-modeling/BankPlanApp';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <div className="App min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <ThemeToggle />
        <BankPlanApp />
      </div>
    </ThemeProvider>
  );
}

export default App;