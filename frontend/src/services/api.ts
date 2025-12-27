import { api } from './http';
import { Animal, AnimalMedia, Application, ApplicationStatus, AuthUser, MedicalRecord, Notification, Shift, UserProfile, Task, PostAdoptionReport, Interview, Agreement, ShiftVolunteer, TaskShift, VolunteerApplication, VolunteerShift } from '../types';

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/login', { email, password });
  return data;
}

export async function registerCandidate(data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: 'candidate' | 'volunteer'; }): Promise<AuthUser> {
  const { data: resp } = await api.post<AuthUser>('/auth/register', data);
  return resp;
}

export async function getAnimals(): Promise<Animal[]> {
  const { data } = await api.get<Animal[]>('/animals');
  return data;
}

export async function reviewAnimal(id: number, approved: boolean, comment?: string) {
  await api.patch(`/animals/${id}/review`, null, { params: { approved, comment } });
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
  const { data } = await api.post<Animal>('/animals', animal);
  return data;
}

export async function updateAnimal(id: number, animal: Partial<Animal>) {
  const { data } = await api.put<Animal>(`/animals/${id}`, animal);
  return data;
}
export async function addSpecies(name: string) {
  await api.post('/animals/species', { name });
}
export async function deleteSpecies(name: string) {
  await api.delete(`/animals/species/${encodeURIComponent(name)}`);
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
  await api.patch(`/animals/${id}/status`, { status });
}
export async function requestAnimalReview(id: number) {
  await api.post(`/animals/${id}/request-review`);
}

export async function addAnimalNote(id: number, note: string) {
  await api.post(`/animals/${id}/notes`, null, { params: { note } });
}

export async function getAnimalNotes(id: number) {
  const { data } = await api.get(`/animals/${id}/notes`);
  return data as { id: number; animalId: number; authorId: number; note: string; createdAt: string }[];
}

export async function updateAnimalMedical(id: number, payload: { readyForAdoption?: boolean }) {
  const { data } = await api.patch<Animal>(`/animals/${id}/medical`, payload);
  return data;
}

export async function submitApplication(
  animalId: number,
  details: { reason?: string; experience?: string; housing?: string },
  passportFile: File,
  consentGiven = true
): Promise<boolean> {
  const formData = new FormData();
  formData.append('animalId', String(animalId));
  if (details?.reason) formData.append('reason', details.reason);
  if (details?.experience) formData.append('experience', details.experience);
  if (details?.housing) formData.append('housing', details.housing);
  formData.append('consentGiven', consentGiven ? 'true' : 'false');
  formData.append('passport', passportFile);

  await api.post('/adoptions/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
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

export async function uploadPassport(applicationId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  await api.post(`/adoptions/applications/${applicationId}/passport`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export async function downloadPassport(applicationId: number): Promise<Blob> {
  const { data } = await api.get(`/adoptions/applications/${applicationId}/passport`, {
    responseType: 'blob'
  });
  return data;
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

export async function getMyShifts(): Promise<VolunteerShift[]> {
  const { data } = await api.get<VolunteerShift[]>('/shifts/me');
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

export async function updateShiftTask(
  shiftId: number,
  taskId: number,
  payload: { progressNotes?: string; taskState?: 'open' | 'in_progress' | 'done'; workedHours?: number }
) {
  const body: any = { taskId, ...payload };
  const { data } = await api.patch<TaskShift>(`/shifts/${shiftId}/tasks/${taskId}`, body);
  return data;
}

export async function submitVolunteerShift(shiftId: number, payload: { workedHours?: number }) {
  const { data } = await api.post(`/shifts/${shiftId}/submit`, payload);
  return data;
}

export async function markAttendance(shiftId: number, volunteerId: number, status: ShiftVolunteer['attendanceStatus'], workedHours?: number) {
  const { data } = await api.patch<ShiftVolunteer>(`/shifts/${shiftId}/attendance`, { volunteerId, status, workedHours });
  return data;
}

export async function approveShift(shiftId: number, volunteerId: number, workedHours?: number, feedback?: string) {
  const { data } = await api.post<ShiftVolunteer>(`/shifts/${shiftId}/approve`, { volunteerId, workedHours, feedback });
  return data;
}

export async function assignTaskToShift(taskId: number, shiftId: number, progressNotes?: string) {
  const { data } = await api.post<TaskShift>('/shifts/tasks/assign', { taskId, shiftId, progressNotes });
  return data;
}

export async function deleteShiftTask(shiftId: number, taskId: number) {
  await api.delete(`/shifts/${shiftId}/tasks/${taskId}`);
}

export async function closeShift(shiftId: number) {
  const { data } = await api.post(`/shifts/${shiftId}/close`, {});
  return data;
}

export async function unsubscribeShift(shiftId: number, reason: string) {
  const { data } = await api.post(`/shifts/${shiftId}/unsubscribe`, { reason });
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

export async function deleteTask(taskId: number) {
  await api.delete(`/tasks/${taskId}`);
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

export async function createAgreement(applicationId: number, postAdoptionPlan: string) {
  const { data } = await api.post<Agreement>('/adoptions/agreements', {
    applicationId,
    postAdoptionPlan
  });
  return data;
}

export async function uploadSignedAgreement(agreementId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<Agreement>(`/adoptions/agreements/${agreementId}/signed`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function confirmAgreement(agreementId: number) {
  const { data } = await api.post<Agreement>(`/adoptions/agreements/${agreementId}/confirm`, {});
  return data;
}

export async function downloadAgreementTemplate(agreementId: number): Promise<Blob> {
  const { data } = await api.get(`/adoptions/agreements/${agreementId}/template`, { responseType: 'blob' });
  return data;
}

export async function downloadSignedAgreement(agreementId: number): Promise<Blob> {
  const { data } = await api.get(`/adoptions/agreements/${agreementId}/signed`, { responseType: 'blob' });
  return data;
}

export async function completeTransfer(applicationId: number, plan: string) {
  return createAgreement(applicationId, plan);
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

export async function declineInterview(interviewId: number) {
  await api.post(`/adoptions/interviews/${interviewId}/decline`);
}

export async function bookInterviewSlot(slotId: number, applicationId: number) {
  await api.post('/adoptions/slots/book', { slotId, applicationId });
}

export async function submitVolunteerApplication(payload: { motivation: string; availability?: string; firstName?: string; lastName?: string; email?: string; phone?: string }) {
  await api.post('/volunteers/applications', payload);
}

export async function getVolunteerApplications(status?: VolunteerApplication['status']): Promise<VolunteerApplication[]> {
  const query = status ? `?status=${status}` : '';
  const { data } = await api.get<VolunteerApplication[]>(`/volunteers/applications${query}`);
  return data;
}

export async function getVolunteerApplication(id: number): Promise<VolunteerApplication> {
  const { data } = await api.get<VolunteerApplication>(`/volunteers/applications/${id}`);
  return data;
}

export async function decideVolunteerApplication(applicationId: number, status: VolunteerApplication['status'], decisionComment?: string) {
  await api.patch('/volunteers/applications/decision', { applicationId, status, decisionComment });
}

export async function cancelAdoptionApplication(applicationId: number, reason?: string) {
  await api.post('/adoptions/applications/cancel', { applicationId, reason });
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

export async function updateUserProfileAdmin(personId: number, payload: { firstName?: string; lastName?: string; phoneNumber?: string }) {
  const { data } = await api.patch<UserProfile>('/users/profile', { personId, ...payload });
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

export async function getAnimalMedia(id: number): Promise<AnimalMedia[]> {
  const { data } = await api.get<AnimalMedia[]>(`/animals/${id}/media`);
  return data.map((m: any) => ({
    ...m,
    url: m.url || m.fileUrl
  }));
}
