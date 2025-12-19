import { api } from './http';
import { Animal, AnimalMedia, Application, ApplicationStatus, AuthUser, MedicalRecord, Notification, Shift, UserProfile, Task, PostAdoptionReport, Interview, Agreement, ShiftVolunteer, TaskShift, VolunteerApplication, MentorAssignment } from '../types';
import axios from 'axios';

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/login', { email, password });
  return data;
}

export async function registerCandidate(data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: 'candidate' | 'volunteer'; }): Promise<AuthUser> {
  const { data: resp } = await api.post<AuthUser>('/auth/register', data);
  return resp;
}

export async function refreshSession(refreshToken: string): Promise<AuthUser> {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
    headers: { 'Content-Type': 'application/json' }
  });
  const { data } = await client.post<AuthUser>('/auth/refresh', { refreshToken });
  return data;
}

export async function getAnimals(): Promise<Animal[]> {
  const { data } = await api.get<Animal[]>('/animals');
  return data;
}

export async function getAnimalSpecies(): Promise<string[]> {
  const { data } = await api.get<string[]>('/animals/species');
  return data;
}

export async function getAnimal(id: number): Promise<Animal | null> {
  try {
    const { data } = await api.get<Animal>(`/animals/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function createAnimal(animal: Partial<Animal>) {
  await api.post('/animals', animal);
}

export async function updateAnimal(id: number, animal: Partial<Animal>) {
  const { data } = await api.put<Animal>(`/animals/${id}`, animal);
  return data;
}

export async function deleteAnimal(id: number) {
  await api.delete(`/animals/${id}`);
}

export async function uploadAnimalMedia(id: number, file: File, description?: string): Promise<AnimalMedia> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);
  const { data } = await api.post<AnimalMedia>(`/animals/${id}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return { ...data, url: (data as any).url || (data as any).fileUrl };
}

export async function updateAnimalStatus(id: number, status: Animal['status']) {
  await api.patch(`/animals/${id}/status`, null, { params: { status } });
}

export async function submitApplication(animalId: number, details?: { reason?: string; experience?: string; housing?: string; }): Promise<boolean> {
  await api.post('/adoptions/applications', { animalId, reason: details?.reason, experience: details?.experience, housing: details?.housing });
  return true;
}

export async function getApplications(status?: ApplicationStatus): Promise<Application[]> {
  const { data } = await api.get<Application[]>(`/adoptions/applications${status ? `?status=${status}` : ''}`);
  return data;
}

export async function getApplicationById(id: number): Promise<Application> {
  const { data } = await api.get<Application>(`/adoptions/applications/${id}`);
  return data;
}

export async function updateApplicationStatus(applicationId: number, status: ApplicationStatus, decisionComment: string) {
  return api.patch('/adoptions/applications/status', { applicationId, status, decisionComment });
}

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>(`/notifications/me`);
  return data;
}

export async function markNotificationRead(id: number) {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.post(`/notifications/read-all`);
}

export async function getMedicalRecords(animalId: number): Promise<MedicalRecord[]> {
  const { data } = await api.get<MedicalRecord[]>(`/medical/animal/${animalId}`);
  return data;
}

export async function getUpcomingMedical(days = 30): Promise<MedicalRecord[]> {
  const { data } = await api.get<MedicalRecord[]>(`/medical/upcoming?days=${days}`);
  return data;
}

export async function createMedicalRecord(record: Partial<MedicalRecord>) {
  await api.post('/medical', record);
}

export async function getShifts(): Promise<Shift[]> {
  const { data } = await api.get<Shift[]>('/shifts');
  return data;
}

export async function getShiftVolunteers(shiftId: number): Promise<ShiftVolunteer[]> {
  const { data } = await api.get<ShiftVolunteer[]>(`/shifts/${shiftId}/volunteers`);
  return data;
}

export async function getShiftTasks(shiftId: number): Promise<TaskShift[]> {
  const { data } = await api.get<TaskShift[]>(`/shifts/${shiftId}/tasks`);
  return data;
}

export async function signupShift(shiftId: number) {
  await api.post('/shifts/signup', { shiftId });
}

export async function assignTaskToShift(taskId: number, shiftId: number, progressNotes?: string) {
  const { data } = await api.post<TaskShift>('/shifts/tasks/assign', { taskId, shiftId, progressNotes });
  return data;
}

export async function createShift(payload: { shiftDate: string; shiftType: Shift['shiftType'] }) {
  const { data } = await api.post<Shift>('/shifts', {
    shiftDate: payload.shiftDate,
    shiftType: payload.shiftType
  });
  return data;
}

function normalizeUser(u: any): UserProfile {
  return {
    ...u,
    roles: (u.roles || []).map((r: any) => (typeof r === 'string' ? r : r.name)),
    active: u.active ?? true,
    avatarUrl: u.avatarUrl
  };
}

export async function getUsers(): Promise<UserProfile[]> {
  const { data } = await api.get<UserProfile[]>('/users');
  return data.map(normalizeUser);
}

export async function createUser(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
}) {
  const { data } = await api.post<UserProfile>('/users', payload);
  return normalizeUser(data);
}

export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks');
  return data;
}

export async function createTask(task: Partial<Task>) {
  const { data } = await api.post<Task>('/tasks', task);
  return data;
}

export async function updateTask(taskId: number, task: Partial<Task>) {
  const { data } = await api.patch<Task>(`/tasks/${taskId}`, task);
  return data;
}

export async function getPostAdoptionReports(): Promise<PostAdoptionReport[]> {
  const { data } = await api.get<PostAdoptionReport[]>('/reports');
  return data;
}

export async function createPostAdoptionReport(payload: Partial<PostAdoptionReport>) {
  const { data } = await api.post<PostAdoptionReport>('/reports', payload);
  return data;
}

export async function updatePostAdoptionReport(id: number, payload: Partial<PostAdoptionReport>) {
  const { data } = await api.put<PostAdoptionReport>(`/reports/${id}`, payload);
  return data;
}

export async function submitReport(id: number, payload: { reportText?: string; submittedDate?: string; status?: PostAdoptionReport['status'] }) {
  const { data } = await api.post(`/reports/${id}/submit`, payload);
  return data;
}

export async function getSetting(key: string): Promise<string> {
  const { data } = await api.get<{ key: string; value: string }>(`/settings/${key}`);
  return data.value;
}

export async function setSetting(key: string, value: string) {
  await api.post(`/settings/${key}`, { value });
}

export async function getReportMedia(reportId: number): Promise<import('../types').ReportMedia[]> {
  const { data } = await api.get(`/reports/${reportId}/media`);
  return data;
}

export async function uploadReportMedia(reportId: number, file: File, description?: string): Promise<import('../types').ReportMedia> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }
  const { data } = await api.post(`/reports/${reportId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function getAgreement(id: number): Promise<Agreement> {
  const { data } = await api.get<Agreement>(`/adoptions/agreements/${id}`);
  return data;
}

export async function getAgreements(): Promise<Agreement[]> {
  const { data } = await api.get<Agreement[]>('/adoptions/agreements');
  return data;
}

export async function completeTransfer(applicationId: number, plan: string, signedDate: string) {
  await api.post('/adoptions/agreements', {
    applicationId,
    postAdoptionPlan: plan,
    signedDate
  });
}

export async function getInterviews(applicationId: number): Promise<Interview[]> {
  const { data } = await api.get<Interview[]>(`/adoptions/applications/${applicationId}/interviews`);
  return data;
}

export async function getAllInterviews(): Promise<Interview[]> {
  const { data } = await api.get<Interview[]>('/adoptions/interviews');
  return data;
}

export async function scheduleInterview(applicationId: number, scheduledAt: string) {
  await api.post('/adoptions/interviews', { applicationId, scheduledAt });
}

export async function updateInterview(interviewId: number, status: Interview['status'], notes?: string, autoApproveApplicationId?: number) {
  await api.patch('/adoptions/interviews', { interviewId, status, notes, autoApproveApplicationId });
}

export async function confirmInterview(interviewId: number) {
  await api.post(`/adoptions/interviews/${interviewId}/confirm`);
}

export async function bookInterviewSlot(slotId: number, applicationId: number) {
  await api.post('/adoptions/slots/book', { slotId, applicationId });
}

export async function submitVolunteerApplication(payload: { motivation: string; availability?: string; }) {
  await api.post('/volunteers/applications', payload);
}

export async function getVolunteerApplications(status?: VolunteerApplication['status']): Promise<VolunteerApplication[]> {
  const query = status ? `?status=${status}` : '';
  const { data } = await api.get<VolunteerApplication[]>(`/volunteers/applications${query}`);
  return data;
}

export async function decideVolunteerApplication(applicationId: number, status: VolunteerApplication['status'], decisionComment?: string) {
  await api.patch('/volunteers/applications/decision', { applicationId, status, decisionComment });
}

export async function cancelInterviewSlot(slotId: number, applicationId: number) {
  await api.post('/adoptions/slots/cancel', { slotId, applicationId });
}

export async function rescheduleInterview(applicationId: number, newSlotId: number) {
  await api.post('/adoptions/slots/reschedule', { applicationId, newSlotId });
}

export async function updateUserRoles(personId: number, roles: string[]) {
  const { data } = await api.patch<UserProfile>('/users/roles', { personId, roles });
  return normalizeUser(data);
}

export async function updateUserStatus(personId: number, active: boolean) {
  const { data } = await api.patch<UserProfile>('/users/status', { personId, active });
  return normalizeUser(data);
}

export async function deleteUser(personId: number) {
  await api.delete('/users', { data: { personId, active: false } });
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UserProfile>('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function updateMyProfile(payload: { firstName?: string; lastName?: string; phoneNumber?: string }) {
  const { data } = await api.patch<UserProfile>('/users/me/profile', payload);
  return data;
}

export async function deactivateSelf(password: string) {
  await api.delete('/users/me', { data: { password } });
}

export async function getMentorAssignments(): Promise<MentorAssignment[]> {
  const { data } = await api.get<MentorAssignment[]>('/volunteers/orientation');
  return data;
}

export async function assignOrientation(payload: { volunteerId: number; mentorId: number; orientationDate?: string; mentorFeedback?: string; }) {
  await api.post('/volunteers/orientation', payload);
}

export async function approveOrientation(payload: { volunteerId: number; mentorFeedback?: string; allowSelfShifts?: boolean }) {
  await api.patch('/volunteers/orientation/approve', payload);
}

export async function getAnimalMedia(id: number): Promise<AnimalMedia[]> {
  const { data } = await api.get<AnimalMedia[]>(`/animals/${id}/media`);
  return data.map((m: any) => ({
    ...m,
    url: m.url || m.fileUrl
  }));
}
