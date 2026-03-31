import React from 'react';

export default function AdminSidebar({ activeSection, onShowSection, user, onLogout }) {
  const userName = user?.name || 'Admin';
  const userEmail = user?.email || '';

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        👨‍💼 Admin Portal
      </div>
      {user && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{userName}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{userEmail}</div>
        </div>
      )}
      <nav className="admin-nav">
        <button
          className={`admin-nav-item ${activeSection === 'tracking' ? 'active' : ''}`}
          onClick={() => onShowSection('tracking')}
        >
          📍 Real-Time Tracking
        </button>
        <button
          className={`admin-nav-item ${activeSection === 'teachers' ? 'active' : ''}`}
          onClick={() => onShowSection('teachers')}
        >
          👩‍🏫 Teachers
        </button>
        <button
          className={`admin-nav-item ${activeSection === 'notices' ? 'active' : ''}`}
          onClick={() => onShowSection('notices')}
        >
          📢 Announcements
        </button>
        <button
          className={`admin-nav-item ${activeSection === 'leaves' ? 'active' : ''}`}
          onClick={() => onShowSection('leaves')}
        >
          📋 Leave Requests
        </button>
        <button
          className="admin-nav-item"
          onClick={onLogout}
          style={{ color: 'rgba(220,100,100,0.8)', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}
        >
          🚪 Logout
        </button>
      </nav>
    </div>
  );
}
