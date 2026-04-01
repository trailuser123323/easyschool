import React, { useState } from 'react';
import { resolveApiAssetUrl } from '../api';

function getMonthAttendance(teacher, date = new Date()) {
  const records = Array.isArray(teacher?.attendanceRecords) ? teacher.attendanceRecords : [];
  const monthPrefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthlyRecords = records
    .filter((record) => record?.date?.startsWith(monthPrefix))
    .sort((left, right) => (right.date || '').localeCompare(left.date || ''));

  return {
    monthlyRecords,
    present: monthlyRecords.filter((record) => record.status === 'present').length,
    absent: monthlyRecords.filter((record) => record.status === 'absent').length,
    leave: monthlyRecords.filter((record) => record.status === 'leave').length,
  };
}

function getStatusMeta(status) {
  if (status === 'present') {
    return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  }

  if (status === 'leave') {
    return 'bg-amber-100 text-amber-800 ring-amber-200';
  }

  return 'bg-rose-100 text-rose-800 ring-rose-200';
}

function getLocationLabel(teacher) {
  return teacher.onDuty || teacher.status === 'present' ? '18.52°N, 73.85°E' : 'Offline';
}

function TrackingStatCard({ label, value, tone }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-900 ring-slate-200',
    emerald: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
    rose: 'bg-rose-100 text-rose-900 ring-rose-200',
    amber: 'bg-amber-100 text-amber-900 ring-amber-200',
    blue: 'bg-blue-100 text-blue-900 ring-blue-200',
    violet: 'bg-violet-100 text-violet-900 ring-violet-200',
    teal: 'bg-teal-100 text-teal-900 ring-teal-200',
  };

  return (
    <div className={`rounded-2xl px-4 py-4 ring-1 ${tones[tone] || tones.slate}`}>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">{label}</div>
    </div>
  );
}

export default function TeacherTracking({ teachers }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const totalTeachers = teachers.length;
  const presentCount = teachers.filter((teacher) => teacher.status === 'present').length;
  const absentCount = teachers.filter((teacher) => teacher.status === 'absent').length;
  const leaveCount = teachers.filter((teacher) => teacher.status === 'leave').length;
  const onDutyCount = teachers.filter((teacher) => teacher.onDuty).length;
  const photoCount = teachers.filter((teacher) => teacher.loginPhoto || teacher.checkoutPhoto).length;
  const averageRate = teachers.length > 0
    ? `${Math.round(
        teachers.reduce((sum, teacher) => sum + (parseInt(String(teacher.rate || '0').replace('%', ''), 10) || 0), 0) / teachers.length
      )}%`
    : '0%';
  const selectedTeacherAttendance = selectedTeacher ? getMonthAttendance(selectedTeacher) : null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Real-Time Teacher Tracking</h1>
          <p className="mt-2 text-sm text-slate-500">
            Live attendance snapshot and teacher activity overview.
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:w-[52rem] xl:grid-cols-4">
          <TrackingStatCard label="Teachers" value={totalTeachers} tone="slate" />
          <TrackingStatCard label="Present" value={presentCount} tone="emerald" />
          <TrackingStatCard label="Absent" value={absentCount} tone="rose" />
          <TrackingStatCard label="On Leave" value={leaveCount} tone="amber" />
          <TrackingStatCard label="On Duty" value={onDutyCount} tone="blue" />
          <TrackingStatCard label="Photos Today" value={photoCount} tone="violet" />
          <TrackingStatCard label="Avg Attendance" value={averageRate} tone="teal" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white shadow-sm"
                style={{ background: teacher.color || '#667eea' }}
                onClick={() => setSelectedTeacher(teacher)}
                title={`View ${teacher.name} profile`}
              >
                {teacher.initials}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-slate-900">{teacher.name}</div>
                <div className="truncate text-sm text-slate-500">{teacher.subject} • {teacher.class}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ${getStatusMeta(teacher.status)}`}>
                {teacher.status}
              </span>
              <span className="text-xs text-slate-500">{teacher.checkin}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Check-in</div>
                <div className="mt-1 font-semibold text-slate-800">{teacher.checkin}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Duty</div>
                <div className="mt-1 font-semibold text-slate-800">{teacher.onDuty ? 'On Duty' : 'Off Duty'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Absent Days</div>
                <div className="mt-1 font-semibold text-slate-800">{teacher.absent}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Attendance</div>
                <div className="mt-1 font-semibold text-slate-800">{teacher.rate}</div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Last location:</span> {getLocationLabel(teacher)}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => setSelectedTeacher(teacher)}
            >
              View teacher profile
            </button>
          </div>
        ))}
      </div>

      {selectedTeacher && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-6" onClick={() => setSelectedTeacher(null)}>
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-slate-900">{selectedTeacher.name}</div>
                <div className="mt-1 text-sm text-slate-500">{selectedTeacher.subject} • {selectedTeacher.class}</div>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700 transition hover:bg-slate-200"
                onClick={() => setSelectedTeacher(null)}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">Check-in {selectedTeacher.checkin ? `• ${selectedTeacher.checkin}` : ''}</div>
                {selectedTeacher.loginPhoto ? (
                  <img
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50"
                    src={resolveApiAssetUrl(selectedTeacher.loginPhoto)}
                    alt={`${selectedTeacher.name} check-in`}
                  />
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                    No check-in photo
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">Check-out {selectedTeacher.checkout && selectedTeacher.checkout !== '–' ? `• ${selectedTeacher.checkout}` : ''}</div>
                {selectedTeacher.checkoutPhoto ? (
                  <img
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50"
                    src={resolveApiAssetUrl(selectedTeacher.checkoutPhoto)}
                    alt={`${selectedTeacher.name} check-out`}
                  />
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                    No check-out photo
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="text-base font-semibold text-slate-900">
                Monthly Attendance · {new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TrackingStatCard label="Present" value={selectedTeacherAttendance?.present || 0} tone="emerald" />
                <TrackingStatCard label="Absent" value={selectedTeacherAttendance?.absent || 0} tone="rose" />
                <TrackingStatCard label="Leave" value={selectedTeacherAttendance?.leave || 0} tone="amber" />
              </div>
              <div className="mt-4 space-y-3">
                {selectedTeacherAttendance?.monthlyRecords?.length ? (
                  selectedTeacherAttendance.monthlyRecords.map((record) => (
                    <div key={`${record.date}-${record.checkin}-${record.checkout}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {new Date(`${record.date}T00:00:00`).toLocaleDateString([], {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          In: {record.checkin || '–'} · Out: {record.checkout || '–'}
                        </div>
                      </div>
                      <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ${getStatusMeta(record.status || 'absent')}`}>
                        {record.status || 'absent'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                    No attendance records for this month yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
