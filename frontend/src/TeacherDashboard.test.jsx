import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import TeacherDashboard from './TeacherDashboard';
import { getDateKey } from './attendance';

const baseTeacher = {
  id: 'teacher-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  role: 'teacher',
  subject: 'Science',
  class: '9A',
  initials: 'AJ',
  color: '#4f46e5',
  status: 'absent',
  checkin: '–',
  checkout: '–',
  onDuty: false,
  absent: 0,
  leave: 0,
  rate: '93%',
  loginPhoto: '',
  checkoutPhoto: '',
  lastLogin: null,
  lastCheckout: null,
  attendanceRecords: [],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [],
  });
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('TeacherDashboard attendance photo actions', () => {
  test('shows add photo actions even when no attendance photos exist', async () => {
    render(<TeacherDashboard teacher={baseTeacher} onLogout={() => {}} />);

    expect(await screen.findByText('Attendance Photo Proof')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add Photo' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Retake Photo' })).not.toBeInTheDocument();
  });

  test('shows retake photo actions when attendance photos already exist', async () => {
    const now = new Date().toISOString();

    render(
      <TeacherDashboard
        teacher={{
          ...baseTeacher,
          status: 'present',
          checkin: '9:00 AM',
          checkout: '5:00 PM',
          loginPhoto: 'data:image/jpeg;base64,abc',
          checkoutPhoto: 'data:image/jpeg;base64,def',
          lastLogin: now,
          lastCheckout: now,
          attendanceRecords: [
            {
              date: getDateKey(),
              status: 'present',
              checkin: '9:00 AM',
              checkout: '5:00 PM',
            },
          ],
        }}
        onLogout={() => {}}
      />
    );

    expect(await screen.findAllByRole('button', { name: 'Retake Photo' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Delete Photo' })).toHaveLength(2);
  });
});
