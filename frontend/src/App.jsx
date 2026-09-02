import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import ConnectGmailPage from './pages/ConnectGmailPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL query parameters for Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const connectedParam = params.get('connected');
    const tokenParam = params.get('token');

    if (connectedParam === 'true') {
      localStorage.setItem('gmail_connected', 'true');
      if (tokenParam) {
        localStorage.setItem('gmail_token', tokenParam);
      }
      setGmailConnected(true);

      const existingUser = localStorage.getItem('user');
      if (existingUser) {
        setUser(JSON.parse(existingUser));
      } else {
        const gUser = { id: 'google-user', email: 'Connected Google Account', display_name: 'Gmail User' };
        localStorage.setItem('user', JSON.stringify(gUser));
        localStorage.setItem('access_token', tokenParam || 'google_auth_token');
        setUser(gUser);
      }

      // Clean the URL bar without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedUser = localStorage.getItem('user');
      const savedGmail = localStorage.getItem('gmail_connected');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedGmail === 'true') {
        setGmailConnected(true);
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleGmailConnected = (token) => {
    setGmailConnected(true);
    localStorage.setItem('gmail_connected', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('gmail_connected');
    setUser(null);
    setGmailConnected(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 1. Not signed in -> Show Auth Page
  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. Signed in, but Gmail not yet connected -> Show Connect Gmail Page
  if (!gmailConnected) {
    return <ConnectGmailPage onConnected={handleGmailConnected} />;
  }

  // 3. Authenticated & Connected -> Show Dashboard
  return <DashboardPage user={user} onLogout={handleLogout} />;
}
