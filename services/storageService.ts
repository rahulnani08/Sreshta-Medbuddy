import { User, FeverRecord, Prescription } from '../types';

const KEYS = {
  USERS: 'sreshta_users',
  FEVER_LOGS: 'sreshta_fever_logs',
  PRESCRIPTIONS: 'sreshta_prescriptions',
};

// --- Users ---
export const getUsers = (): User[] => {
  const data = localStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  // Cleanup related data
  const fevers = getAllFeverRecords().filter(f => f.userId !== userId);
  localStorage.setItem(KEYS.FEVER_LOGS, JSON.stringify(fevers));
  const meds = getAllGlobalPrescriptions().filter(p => p.userId !== userId);
  localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(meds));
};

// --- Fever ---
const getAllFeverRecords = (): FeverRecord[] => {
  const data = localStorage.getItem(KEYS.FEVER_LOGS);
  return data ? JSON.parse(data) : [];
};

export const getFeverRecords = (userId: string): FeverRecord[] => {
  const all = getAllFeverRecords();
  return all.filter(r => r.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
};

export const saveFeverRecord = (record: FeverRecord): void => {
  const all = getAllFeverRecords();
  all.push(record);
  localStorage.setItem(KEYS.FEVER_LOGS, JSON.stringify(all));
};

export const deleteFeverRecord = (recordId: string): void => {
  const all = getAllFeverRecords().filter(r => r.id !== recordId);
  localStorage.setItem(KEYS.FEVER_LOGS, JSON.stringify(all));
};

// --- Prescriptions ---
export const getAllGlobalPrescriptions = (): Prescription[] => {
  const data = localStorage.getItem(KEYS.PRESCRIPTIONS);
  return data ? JSON.parse(data) : [];
};

export const getPrescriptions = (userId: string): Prescription[] => {
  const all = getAllGlobalPrescriptions();
  return all.filter(r => r.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
};

export const savePrescription = (prescription: Prescription): void => {
  const all = getAllGlobalPrescriptions();
  all.push(prescription);
  localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(all));
};

export const updatePrescription = (prescription: Prescription): void => {
  const all = getAllGlobalPrescriptions();
  const index = all.findIndex(p => p.id === prescription.id);
  if (index !== -1) {
    all[index] = prescription;
    localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(all));
  }
};

export const deletePrescription = (id: string): void => {
  const all = getAllGlobalPrescriptions().filter(p => p.id !== id);
  localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(all));
};

// --- Import/Export ---
export const exportData = (): string => {
  const data = {
    users: getUsers(),
    feverLogs: getAllFeverRecords(),
    prescriptions: getAllGlobalPrescriptions(),
  };
  return JSON.stringify(data);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.users && Array.isArray(data.users)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
      localStorage.setItem(KEYS.FEVER_LOGS, JSON.stringify(data.feverLogs || []));
      localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(data.prescriptions || []));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};
