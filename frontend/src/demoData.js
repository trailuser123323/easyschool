const LEAVE_REQUESTS_KEY = "teacher_leave_requests_fallback";

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
