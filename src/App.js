import React from 'react';
import './lib/utils/debugLogger.js'; // Initialize centralized logging
import BankPlanApp from './features/financial-modeling/BankPlanApp';

function App() {
  return (
    <div className="App">
      <BankPlanApp />
    </div>
  );
}

export default App;