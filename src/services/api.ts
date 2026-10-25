// AICONEKT TECHNOLOGIES — Typed Production API Client

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('aiconekt_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('aiconekt_auth_token', token);
  } else {
    localStorage.removeItem('aiconekt_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    demoLogin: (role: string = 'Administrator') =>
      request<{ token: string; user: any }>('/auth/demo', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: { email: string; password: string; full_name: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () => request<{ user: any }>('/auth/me'),
    updateProfile: (profile: { full_name?: string; bio?: string; avatar_url?: string }) =>
      request<{ user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },

  // Projects
  projects: {
    getAll: () => request<{ projects: any[] }>('/projects'),
    getById: (id: string) => request<{ project: any }>(`/projects/${id}`),
    create: (projectData: any) =>
      request<{ project: any }>('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      }),
    update: (id: string, projectData: any) =>
      request<{ project: any }>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/projects/${id}`, {
        method: 'DELETE',
      }),
  },

  // Events & Hackathons
  events: {
    getAll: () => request<{ events: any[] }>('/events'),
    getById: (id: string) => request<{ event: any }>(`/events/${id}`),
    create: (eventData: any) =>
      request<{ event: any }>('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    update: (id: string, eventData: any) =>
      request<{ event: any }>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/events/${id}`, {
        method: 'DELETE',
      }),
    registerAttendee: (eventId: string, attendee: { attendee_name: string; attendee_email: string }) =>
      request<{ success: boolean; message: string; registration_id: string }>(`/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify(attendee),
      }),
    createEventTeam: (eventId: string, teamData: any) =>
      request<{ team: any }>(`/events/${eventId}/teams`, {
        method: 'POST',
        body: JSON.stringify(teamData),
      }),
  },

  // Organisation Departments, Teams & Member Directory
  org: {
    getDepartments: () => request<{ departments: any[] }>('/org/departments'),
    createDepartment: (deptData: any) =>
      request<{ department: any }>('/org/departments', {
        method: 'POST',
        body: JSON.stringify(deptData),
      }),
    getTeams: () => request<{ teams: any[] }>('/org/teams'),
    createTeam: (teamData: any) =>
      request<{ team: any }>('/org/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
      }),
    addTeamMember: (teamId: string, memberData: { user_id: string; role_in_team?: string }) =>
      request<{ success: boolean; message: string }>(`/org/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData),
      }),
    removeTeamMember: (teamId: string, userId: string) =>
      request<{ success: boolean; message: string }>(`/org/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      }),
    getMembers: () => request<{ members: any[] }>('/org/members'),
  },

  // Posts & Announcements
  posts: {
    getAll: () => request<{ posts: any[] }>('/posts'),
    getById: (id: string) => request<{ post: any }>(`/posts/${id}`),
    create: (postData: any) =>
      request<{ post: any }>('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      }),
    update: (id: string, postData: any) =>
      request<{ post: any }>(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(postData),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/posts/${id}`, {
        method: 'DELETE',
      }),
  },

  // Careers & Applications
  careers: {
    getAll: () => request<{ careers: any[] }>('/careers'),
    create: (careerData: any) =>
      request<{ career: any }>('/careers', {
        method: 'POST',
        body: JSON.stringify(careerData),
      }),
    apply: (applicationData: any) =>
      request<{ success: boolean; message: string; application_id: string }>('/careers/apply', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      }),
    getApplications: () => request<{ applications: any[] }>('/careers/applications'),
    updateApplicationStatus: (id: string, status: string) =>
      request<{ success: boolean; message: string }>(`/careers/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  // Contact Inquiries & Notification Pipeline
  contact: {
    submit: (inquiry: { name: string; email: string; subject?: string; category?: string; message: string }) =>
      request<{ success: boolean; message: string; inquiry_id: string; notification: any }>('/contact', {
        method: 'POST',
        body: JSON.stringify(inquiry),
      }),
    getInquiries: (filters?: { status?: string; category?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.search) params.set('search', filters.search);
      return request<{ inquiries: any[] }>(`/contact/inquiries?${params.toString()}`);
    },
    getInquiryById: (id: string) => request<{ inquiry: any; notification_logs: any[] }>(`/contact/inquiries/${id}`),
    updateInquiry: (id: string, data: { status?: string; priority?: string; admin_notes?: string }) =>
      request<{ inquiry: any }>(`/contact/inquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteInquiry: (id: string) =>
      request<{ success: boolean; message: string }>(`/contact/inquiries/${id}`, {
        method: 'DELETE',
      }),
  },

  // Dashboard Telemetry
  dashboard: {
    getStats: () => request<{ metrics: any; recent_activity: any[]; system_status: any }>('/dashboard/stats'),
  },
};
