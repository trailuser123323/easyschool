const STORAGE_KEY = "teacher_records_fallback";
const LEAVE_REQUESTS_KEY = "teacher_leave_requests_fallback";
const ANNOUNCEMENTS_KEY = "school_announcements";
export const ANNOUNCEMENTS_UPDATED_EVENT = "school-announcements-updated";

const DEFAULT_TEACHERS = [
  {
    id: "demo-teacher-1",
    name: "Ganeshsir",
    email: "gstar@gmail.com",
    role: "teacher",
    subject: "All Rounder",
    class: "–",
    initials: "G",
    color: "#0f766e",
    status: "absent",
    checkin: "–",
    checkout: "–",
    onDuty: false,
    absent: 0,
    leave: 0,
    rate: "0%",
    loginPhoto: "",
    checkoutPhoto: "",
    lastLogin: null,
    lastCheckout: null,
    updatedAt: 0,
  },
  {
    id: "demo-teacher-2",
    name: "Priya Ramesh",
    email: "teacher1@gmail.com",
    role: "teacher",
    subject: "Science",
    class: "9A",
    initials: "PR",
    color: "#4f46e5",
    status: "absent",
    checkin: "–",
    checkout: "–",
    onDuty: false,
    absent: 2,
    leave: 2,
    rate: "91%",
    loginPhoto: "",
    checkoutPhoto: "",
    lastLogin: null,
    lastCheckout: null,
    updatedAt: 0,
  },
  {
    id: "demo-teacher-3",
    name: "niha",
    email: "niha@gmail.com",
    role: "teacher",
    subject: "DSA",
    class: "–",
    initials: "N",
    color: "#2563eb",
    status: "absent",
    checkin: "–",
    checkout: "–",
    onDuty: false,
    absent: 0,
    leave: 0,
    rate: "0%",
    loginPhoto: "",
    checkoutPhoto: "",
    lastLogin: null,
    lastCheckout: null,
    updatedAt: 0,
  },
  {
    id: "demo-teacher-4",
    name: "Admin",
    email: "admin@gmail.com",
    role: "teacher",
    subject: "General",
    class: "–",
    initials: "AD",
    color: "#7c3aed",
    status: "absent",
    checkin: "–",
    checkout: "–",
    onDuty: false,
    absent: 0,
    leave: 0,
    rate: "0%",
    loginPhoto: "",
    checkoutPhoto: "",
    lastLogin: null,
    lastCheckout: null,
    updatedAt: 0,
  },
];

function mergeDefaultTeachers(storedTeachers) {
  const stored = Array.isArray(storedTeachers) ? storedTeachers : [];
  const merged = [...stored];

  DEFAULT_TEACHERS.forEach((teacher) => {
    const index = merged.findIndex((item) => item?.email === teacher.email);
    if (index >= 0) {
      merged[index] = { ...teacher, ...merged[index] };
      return;
    }

    merged.push(teacher);
  });

  return merged;
}

export function getFallbackTeachers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }

    const parsed = JSON.parse(stored);
    const nextTeachers = mergeDefaultTeachers(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTeachers));
    return nextTeachers.length > 0 ? nextTeachers : DEFAULT_TEACHERS;
  } catch {
    return DEFAULT_TEACHERS;
  }
}

export function saveFallbackTeachers(teachers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
}

export function removeFallbackTeacher(target) {
  const teachers = getFallbackTeachers().filter((teacher) => !teacherMatches(teacher, target));
  saveFallbackTeachers(teachers);
  return teachers;
}

function teacherMatches(teacher, target) {
  if (!teacher || !target) return false;

  return (
    (teacher._id && target._id && teacher._id === target._id) ||
    (teacher.id && target.id && teacher.id === target.id) ||
    (teacher.email && target.email && teacher.email === target.email)
  );
}

export function upsertFallbackTeacher(target, updates = {}) {
  const teachers = getFallbackTeachers();
  const index = teachers.findIndex((teacher) => teacherMatches(teacher, target));
  const baseTeacher = index >= 0 ? teachers[index] : { ...target };
  const nextTeacher = { ...baseTeacher, ...updates, updatedAt: Date.now() };

  if (index >= 0) {
    teachers[index] = nextTeacher;
  } else {
    teachers.unshift(nextTeacher);
  }

  saveFallbackTeachers(teachers);
  return nextTeacher;
}

const DEFAULT_LEAVE_REQUESTS = [
  {
    id: "leave-request-1",
    name: "Priya Ramesh",
    type: "Casual Leave",
    dates: "Apr 1, 2026",
    status: "pending",
    initials: "PR",
    color: "#4f46e5",
  },
];

export function getFallbackLeaveRequests() {
  try {
    const stored = localStorage.getItem(LEAVE_REQUESTS_KEY);
    if (!stored) {
      localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(DEFAULT_LEAVE_REQUESTS));
      return DEFAULT_LEAVE_REQUESTS;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : DEFAULT_LEAVE_REQUESTS;
  } catch {
    return DEFAULT_LEAVE_REQUESTS;
  }
}

export function saveFallbackLeaveRequests(requests) {
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
}

export function getAnnouncements() {
  try {
    const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!stored) {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([]));
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnnouncements(announcements) {
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(Array.isArray(announcements) ? announcements : []));
  window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_UPDATED_EVENT));
}
