import { useState, useCallback } from 'react';
import BottomNav from './components/BottomNav';
import Today from './pages/Today';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [settingsVersion, setSettingsVersion] = useState(0);

  const handleSettingsChange = useCallback(() => {
    setSettingsVersion(v => v + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 max-w-lg mx-auto">
      {activeTab === 'today' && <Today key={settingsVersion} />}
      {activeTab === 'history' && <History />}
      {activeTab === 'settings' && <Settings onSettingsChange={handleSettingsChange} />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
