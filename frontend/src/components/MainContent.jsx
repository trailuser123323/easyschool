import React from 'react';

export default function MainContent({
  activeSection,
  onShowSection,
  onDuty,
  onToggleDuty,
  onShowToast,
  currentYear,
  currentMonth,
  onSetYear,
  onSetMonth
}) {
  const getContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="content-section">
            <h1>Welcome to Teacher Dashboard</h1>
            <p>Select an option from the sidebar to get started</p>
            <div className="status-card">
              <h3>Current Status</h3>
              <p>On Duty: {onDuty ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        );
      case 'classes':
        return (
          <div className="content-section">
            <h1>My Classes</h1>
            <p>Manage your classes here</p>
          </div>
        );
      case 'attendance':
        return (
          <div className="content-section">
            <h1>Attendance</h1>
            <p>Track student attendance</p>
          </div>
        );
      case 'assignments':
        return (
          <div className="content-section">
            <h1>Assignments</h1>
            <p>Create and manage assignments</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="main-content">
      {getContent()}
    </div>
  );
}
