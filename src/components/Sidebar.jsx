import React from 'react';

export default function Sidebar({ activeSection, onShowSection, onToggleDuty }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Teacher Portal</h2>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => onShowSection('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-item ${activeSection === 'classes' ? 'active' : ''}`}
          onClick={() => onShowSection('classes')}
        >
          My Classes
        </button>
        <button
          className={`nav-item ${activeSection === 'attendance' ? 'active' : ''}`}
          onClick={() => onShowSection('attendance')}
        >
          Attendance
        </button>
        <button
          className={`nav-item ${activeSection === 'assignments' ? 'active' : ''}`}
          onClick={() => onShowSection('assignments')}
        >
          Assignments
        </button>
      </nav>
      <div className="sidebar-footer">
        <button className="duty-btn" onClick={onToggleDuty}>
          🔔 Mark Duty
        </button>
      </div>
    </div>
  );
}
