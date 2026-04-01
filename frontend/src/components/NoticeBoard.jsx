import React, { useState } from 'react';

export default function NoticeBoard({ announcements, onAddAnnouncement, onUpdateAnnouncement, onDeleteAnnouncement }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await onUpdateAnnouncement(editingId, title, body);
      } else {
        await onAddAnnouncement(title, body);
      }
      setTitle('');
      setBody('');
      setEditingId('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to save announcement.');
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
          {saving ? (editingId ? 'Saving...' : 'Posting...') : (editingId ? '💾 Save Announcement' : '📤 Post Announcement')}
        </button>
        {editingId && (
          <button
            type="button"
            className="btn-submit"
            style={{ background: '#e5e7eb', color: '#111827' }}
            onClick={() => {
              setEditingId('');
              setTitle('');
              setBody('');
              setError('');
            }}
          >
            Cancel Edit
          </button>
        )}
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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn-submit"
                      style={{ width: 'auto', padding: '8px 12px', background: '#eef2ff', color: '#4338ca' }}
                      onClick={() => {
                        setEditingId(announcement.id);
                        setTitle(announcement.title);
                        setBody(announcement.body);
                        setError('');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-submit"
                      style={{ width: 'auto', padding: '8px 12px', background: '#fee2e2', color: '#b91c1c' }}
                      onClick={async () => {
                        try {
                          await onDeleteAnnouncement(announcement.id);
                          if (editingId === announcement.id) {
                            setEditingId('');
                            setTitle('');
                            setBody('');
                          }
                        } catch (deleteError) {
                          setError(deleteError.message || 'Unable to delete announcement.');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
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
