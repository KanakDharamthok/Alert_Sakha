import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'sos' | 'update' | 'assignment' | 'info';
  read: boolean;
  createdAt: string;
  location?: { floor: string; room?: string; zone?: string };
  coordinator?: { name: string; role: string; phone: string };
  logs?: { time: string; event: string; by: string }[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const mockNotifications: Notification[] = [
  {
    id: '1', title: 'SOS Alert', message: 'Fire detected in Kitchen Area - Floor 2', type: 'sos', read: false,
    createdAt: '2026-04-07T08:30:00Z', severity: 'critical',
    location: { floor: 'Floor 2', zone: 'Kitchen — Hot Line' },
    coordinator: { name: 'Maria Santos', role: 'Security Lead', phone: '+971 50 442 8821' },
    logs: [
      { time: '08:30', event: 'Fire alarm triggered by sensor K-12', by: 'System' },
      { time: '08:32', event: 'Staff notified across Floor 2', by: 'Coordinator' },
      { time: '08:35', event: 'Evacuation initiated for east wing', by: 'Security Team' },
      { time: '08:45', event: 'Fire response team dispatched', by: 'Manager' },
    ],
  },
  {
    id: '2', title: 'New Assignment', message: 'You have been assigned to Medical Emergency - Room 412', type: 'assignment', read: false,
    createdAt: '2026-04-07T07:18:00Z', severity: 'high',
    location: { floor: 'Floor 4', room: 'Room 412' },
    coordinator: { name: 'Dr. Anita Verma', role: 'Medical Coordinator', phone: '+971 50 991 2244' },
    logs: [
      { time: '07:15', event: 'Guest reported chest pain', by: 'Front Desk' },
      { time: '07:18', event: 'Assigned to first-response team', by: 'Coordinator' },
    ],
  },
  {
    id: '3', title: 'Status Update', message: 'Theft Report in Lobby updated to In Progress', type: 'update', read: true,
    createdAt: '2026-04-07T06:10:00Z', severity: 'medium',
    location: { floor: 'Ground', zone: 'Main Lobby' },
    coordinator: { name: 'Ahmed Khan', role: 'Security Officer', phone: '+971 50 332 1100' },
    logs: [
      { time: '06:00', event: 'Theft reported by guest', by: 'Guest' },
      { time: '06:05', event: 'CCTV review started', by: 'Security' },
      { time: '06:10', event: 'Status updated to In Progress', by: 'Manager' },
    ],
  },
  {
    id: '4', title: 'Incident Resolved', message: 'Suspicious Activity in Parking has been resolved', type: 'info', read: true,
    createdAt: '2026-04-06T23:00:00Z', severity: 'low',
    location: { floor: 'Basement', zone: 'Parking Lot B' },
    coordinator: { name: 'Night Security', role: 'Security Patrol', phone: '+971 50 555 7788' },
    logs: [
      { time: '22:00', event: 'Activity reported', by: 'Guard' },
      { time: '22:30', event: 'Vehicle identified as delivery', by: 'Security' },
      { time: '23:00', event: 'Incident closed', by: 'Manager' },
    ],
  },
  {
    id: '5', title: 'Power Outage', message: 'East Wing experiencing complete power failure', type: 'sos', read: false,
    createdAt: '2026-04-07T09:00:00Z', severity: 'high',
    location: { floor: 'All Floors', zone: 'East Wing' },
    coordinator: { name: 'Engineering Desk', role: 'Facilities', phone: '+971 50 778 0099' },
    logs: [
      { time: '09:00', event: 'Power outage detected', by: 'System' },
      { time: '09:05', event: 'Backup generators activated', by: 'Engineering' },
    ],
  },
];

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.read).length,
  markAsRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, read: true } : n);
    set({ notifications: updated, unreadCount: updated.filter(n => !n.read).length });
  },
  markAllRead: () => {
    set({ notifications: get().notifications.map(n => ({ ...n, read: true })), unreadCount: 0 });
  },
}));
