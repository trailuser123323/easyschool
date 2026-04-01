import React, { useState } from 'react';

export default function NoticeBoard({ announcements, onAddAnnouncement }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSaving(true);
    setError('');

    try {
      await onAddAnnouncement(title, body);
      setTitle('');
      setBody('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to post announcement.');
    } finally {
      setSaving(false);
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
          {saving ? 'Posting...' : '📤 Post Announcement'}
        </button>
        {error && <div style={{ color: '#b91c1c', fontSize: '13px' }}>{error}</div>}
      </form>

      <div className="notices-list">
        {announcements.length > 0 ? (
          announcements.map(announcement => (
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
          ))
        ) : (
          <div className="notice-item">
            <div className="notice-body">No announcements posted yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}
