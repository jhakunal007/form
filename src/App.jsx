import { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import RegisteredUsersBadge from './components/RegisteredUsersBadge';
import SuccessModal from './components/SuccessModal';
import { UserCheck, Sparkles, Database, RotateCcw, Server, Wifi, WifiOff } from 'lucide-react';
import { fetchRegisteredUsernames, resetDatabase, checkBackendHealth } from './api';
import './App.css';

const DEFAULT_FALLBACK_USERNAMES = [
  // 'admin',
  // 'alex',
  // 'sarah_k',
  // 'johndoe',
  // 'developer',
  // 'crypto_king',
  // 'nova_user',
];

export default function App() {
  const [takenUsernames, setTakenUsernames] = useState(DEFAULT_FALLBACK_USERNAMES);
  const [selectedTestUsername, setSelectedTestUsername] = useState('');
  const [registeredUserSuccess, setRegisteredUserSuccess] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Check health and load usernames from backend on mount
  const syncWithBackend = async () => {
    try {
      const health = await checkBackendHealth();
      setBackendOnline(health.connected);

      if (health.connected) {
        const usernames = await fetchRegisteredUsernames();
        setTakenUsernames(usernames);
      }
    } catch (e) {
      console.warn('Could not sync with backend, using local defaults', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    syncWithBackend();
    // Poll health status periodically
    const interval = setInterval(syncWithBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterSuccess = (newUser) => {
    // Add new user to the list
    setTakenUsernames((prev) => [newUser.username, ...prev.filter((u) => u.toLowerCase() !== newUser.username.toLowerCase())]);
    setRegisteredUserSuccess(newUser);
  };

  const handleResetDatabase = async () => {
    try {
      if (backendOnline) {
        const res = await resetDatabase();
        if (res.usernames) {
          setTakenUsernames(res.usernames);
        }
      } else {
        setTakenUsernames(DEFAULT_FALLBACK_USERNAMES);
      }
      setSelectedTestUsername('');
    } catch (e) {
      console.error('Failed resetting backend database:', e);
    }
  };

  return (
    <main className="app-container">
      {/* Brand Header */}
      <header className="app-header">
        <div className="header-badges">
          <div className="badge-pill">
            <Sparkles size={14} className="badge-icon" />
            <span>Live Registration</span>
          </div>

          <div className={`badge-pill ${backendOnline ? 'badge-backend-online' : 'badge-backend-offline'}`}>
            {backendOnline ? (
              <>
                <Wifi size={13} className="badge-icon-status" />
                <span>Backend API Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="badge-icon-status" />
                <span>Syncing Backend...</span>
              </>
            )}
          </div>
        </div>

        <h1 className="main-title">
          Create an <span className="text-gradient">Account</span>
        </h1>
        <p className="main-subtitle">
          A Simple form connected to my backend
        </p>
      </header>

      {/* Main Dual-Column Content Grid */}
      <div className="content-grid">
        {/* Form Card */}
        <section className="form-card" aria-label="Registration Card">
          <div className="card-ambient-glow" aria-hidden="true" />

          <div className="card-header">
            <div className="icon-badge">
              <UserCheck size={22} className="icon-badge-svg" />
            </div>
            <div>
              <h2 className="card-title">Join the Network</h2>
              <p className="card-subtitle">All fields marked with an asterisk (*) are required</p>
            </div>
          </div>

          <RegistrationForm
            takenUsernames={takenUsernames}
            onRegisterSuccess={handleRegisterSuccess}
            selectedUsernameTest={selectedTestUsername}
          />
        </section>

        {/* Database & Validation Testing Companion Panel */}
        <aside className="companion-panel" aria-label="Database preview and testing tools">
          <RegisteredUsersBadge
            takenUsernames={takenUsernames}
            onSelectUsername={(name) => setSelectedTestUsername(name)}
          />

          {/* <div className="info-card">
            <div className="info-card-header">
              <Server size={16} className="info-icon" />
              <h4>Backend Uniqueness Engine</h4>
            </div>
            <ul className="info-list">
              <li>
                <strong>REST API Verified:</strong> Calls <code>GET /api/check-username</code> debounced as you type.
              </li>
              <li>
                <strong>Case-Insensitive Constraint:</strong> <code>@Admin</code>, <code>@admin</code>, and <code>@ADMIN</code> trigger a <code>409 Conflict</code>.
              </li>
              <li>
                <strong>Secure Storage:</strong> Passwords are salt-hashed using <code>bcryptjs</code> before persisting to <code>backend/data/users.json</code>.
              </li>
            </ul> */}

          {/* <button
              type="button"
              onClick={handleResetDatabase}
              className="btn-reset-db"
              title="Reset reserved list back to default presets"
            >
              <RotateCcw size={14} />
              <span>Reset Database Presets</span>
            </button> */}
          {/* </div> */}
        </aside>
      </div>

      {/* Success Dialog Modal */}
      <SuccessModal
        user={registeredUserSuccess}
        onClose={() => setRegisteredUserSuccess(null)}
      />
    </main>
  );
}
