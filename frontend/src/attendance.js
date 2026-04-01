export function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isSameCalendarDay(value, date = new Date()) {
  if (!value) return false;

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  return getDateKey(parsed) === getDateKey(date);
}

export function getAttendanceRecordForDate(records, date = new Date()) {
  if (!Array.isArray(records)) return null;

  const todayKey = getDateKey(date);
  return records.find((record) => record?.date === todayKey) || null;
}

export function getTeacherAttendanceSnapshot(teacher, date = new Date()) {
  const record = getAttendanceRecordForDate(teacher?.attendanceRecords, date);

  if (!record) {
    return {
      status: "absent",
      checkin: "–",
      checkout: "–",
    };
  }

  return {
    status: record.status || "absent",
    checkin: record.checkin || "–",
    checkout: record.checkout || "–",
  };
}

export function normaliseTeacherForToday(teacher, date = new Date()) {
  if (!teacher) return teacher;

  const snapshot = getTeacherAttendanceSnapshot(teacher, date);
  const hasCheckin = snapshot.checkin && snapshot.checkin !== "–";
  const hasCheckout = snapshot.checkout && snapshot.checkout !== "–";

  return {
    ...teacher,
    status: snapshot.status,
    checkin: snapshot.checkin,
    checkout: snapshot.checkout,
    onDuty: snapshot.status === "present" ? Boolean(teacher.onDuty) : false,
    loginPhoto: hasCheckin ? teacher.loginPhoto || "" : "",
    checkoutPhoto: hasCheckout ? teacher.checkoutPhoto || "" : "",
    lastLogin: hasCheckin && isSameCalendarDay(teacher.lastLogin, date) ? teacher.lastLogin : null,
    lastCheckout: hasCheckout && isSameCalendarDay(teacher.lastCheckout, date) ? teacher.lastCheckout : null,
  };
}

export function getDelayUntilNextDay(date = new Date()) {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1000, nextMidnight.getTime() - date.getTime());
}
