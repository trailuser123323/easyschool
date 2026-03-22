import React, { useState } from 'react';

export default function NoticeBoard({ announcements, onAddAnnouncement }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && body.trim()) {
      onAddAnnouncement(title, body);
      setTitle('');
      setBody('');
    }
  };

  return (
    <div className="notice-container">
      <div className="notice-header">
        <h1>📢 Announcements & Notice Board</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Post important notices for all teachers
        </p>
      </div>

      <form className="add-notice-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Announcement Title</label>
          <input
            type="text"
            placeholder="e.g., Staff Meeting Tomorrow"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Enter announcement details..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-submit">
          📤 Post Announcement
        </button>
      </form>

      <div className="notices-list">
        {announcements.map(announcement => (
          <div key={announcement.id} className="notice-item">
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>{announcement.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="notice-title">{announcement.title}</div>
                <div className="notice-body">{announcement.body}</div>
                <div className="notice-time">🕐 {announcement.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
