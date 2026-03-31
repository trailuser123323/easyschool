const STORAGE_KEY = "teacher_records_fallback";

const DEFAULT_TEACHERS = [
  {
    id: "demo-teacher-1",
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
];

export function getFallbackTeachers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEACHERS));
      return DEFAULT_TEACHERS;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TEACHERS;
  } catch {
    return DEFAULT_TEACHERS;
  }
}

export function saveFallbackTeachers(teachers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
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
