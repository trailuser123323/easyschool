import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeacherTracking from './TeacherTracking';

const teachers = [
  {
    id: 'teacher-1',
    name: 'Alex Johnson',
    subject: 'Science',
    class: '9A',
    initials: 'AJ',
    color: '#4f46e5',
    status: 'present',
    checkin: '9:00 AM',
    checkout: '–',
    onDuty: true,
    absent: 1,
    rate: '95%',
    loginPhoto: '',
    checkoutPhoto: '',
    attendanceRecords: [],
  },
];

describe('TeacherTracking header layout content', () => {
  test('renders the heading block before the stats grid', () => {
    const { container } = render(<TeacherTracking teachers={teachers} />);

    const trackingHeader = container.querySelector('.tracking-header');
    const headingBlock = trackingHeader.firstElementChild;
    const statsGrid = trackingHeader.querySelector('.tracking-stats-grid');

    expect(screen.getByRole('heading', { name: /real-time teacher tracking/i })).toBeInTheDocument();
    expect(headingBlock).toContainElement(screen.getByText(/last updated:/i));
    expect(trackingHeader.children[1]).toBe(statsGrid);
  });

  test('renders the expected admin stats cards', () => {
    render(<TeacherTracking teachers={teachers} />);

    ['Teachers', 'Present', 'Absent', 'On Leave', 'On Duty', 'Photos Today', 'Avg Attendance'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
