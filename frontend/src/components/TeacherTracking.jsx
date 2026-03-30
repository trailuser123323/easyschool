import React, { useState } from 'react';

export default function TeacherTracking({ teachers }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const presentCount = teachers.filter(t => t.status === 'present').length;
  const absentCount = teachers.filter(t => t.status === 'absent').length;
  const leaveCount = teachers.filter(t => t.status === 'leave').length;

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <div>
          <h1>📍 Real-Time Teacher Tracking</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: '#d4edda', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#155724' }}>{presentCount}</div>
            <div style={{ fontSize: '12px', color: '#155724' }}>Present</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: '#f8d7da', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#721c24' }}>{absentCount}</div>
            <div style={{ fontSize: '12px', color: '#721c24' }}>Absent</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 20px', background: '#fff3cd', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#856404' }}>{leaveCount}</div>
            <div style={{ fontSize: '12px', color: '#856404' }}>On Leave</div>
          </div>
        </div>
      </div>

      <div className="teachers-grid">
        {teachers.map(teacher => (
          <div key={teacher.id} className="teacher-card">
            <div className="teacher-header">
              <button
                type="button"
                className="teacher-avatar teacher-avatar-button"
                style={{ '--teacher-color': teacher.color }}
                onClick={() => teacher.loginPhoto && setSelectedTeacher(teacher)}
                title={teacher.loginPhoto ? `View ${teacher.name} check-in photo` : 'No check-in photo available'}
              >
                {teacher.initials}
              </button>
              <div className="teacher-info">
                <div className="teacher-name">{teacher.name}</div>
                <div className="teacher-subject">{teacher.subject} • {teacher.class}</div>
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <span className={`status-badge status-${teacher.status}`}>
                {teacher.status.toUpperCase()}
              </span>
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                {teacher.checkin}
              </span>
            </div>

            <div className="teacher-details">
              <div className="detail-item">
                <span className="detail-label">Check-in:</span>
                <span className="detail-value">{teacher.checkin}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duty:</span>
                <span className="detail-value">{teacher.onDuty ? '✅' : '❌'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Absent Days:</span>
                <span className="detail-value">{teacher.absent}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Attendance:</span>
                <span className="detail-value">{teacher.rate}</span>
              </div>
            </div>

            <div style={{ padding: '12px 0', borderTop: '1px solid #eee', fontSize: '12px', color: '#666' }}>
              📍 Last location: {Math.random() > 0.5 ? '18.52°N, 73.85°E' : 'Offline'}
            </div>

            <button
              type="button"
              className="teacher-photo-button"
              onClick={() => setSelectedTeacher(teacher)}
              disabled={!teacher.loginPhoto}
            >
              {teacher.loginPhoto ? 'View check-in photo' : 'No check-in photo'}
            </button>
          </div>
        ))}
      </div>

      {selectedTeacher && (
        <div className="teacher-photo-modal" onClick={() => setSelectedTeacher(null)}>
          <div className="teacher-photo-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-photo-header">
              <div>
                <div className="teacher-photo-title">{selectedTeacher.name}</div>
                <div className="teacher-photo-subtitle">
                  {selectedTeacher.subject} • {selectedTeacher.class} • {selectedTeacher.checkin}
                </div>
              </div>
              <button
                type="button"
                className="teacher-photo-close"
                onClick={() => setSelectedTeacher(null)}
              >
                ×
              </button>
            </div>
            <img
              className="teacher-photo-image"
              src={selectedTeacher.loginPhoto}
              alt={`${selectedTeacher.name} check-in`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
