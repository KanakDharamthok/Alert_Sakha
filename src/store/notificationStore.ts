import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'sos' | 'update' | 'assignment' | 'info';
  read: boolean;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'SOS Alert', message: 'Fire detected in Kitchen Area - Floor 2', type: 'sos', read: false, createdAt: '2026-04-07T08:30:00Z' },
  { id: '2', title: 'New Assignment', message: 'You have been assigned to Medical Emergency - Room 412', type: 'assignment', read: false, createdAt: '2026-04-07T07:18:00Z' },
  { id: '3', title: 'Status Update', message: 'Theft Report in Lobby updated to In Progress', type: 'update', read: true, createdAt: '2026-04-07T06:10:00Z' },
  { id: '4', title: 'Incident Resolved', message: 'Suspicious Activity in Parking has been resolved', type: 'info', read: true, createdAt: '2026-04-06T23:00:00Z' },
  { id: '5', title: 'Power Outage', message: 'East Wing experiencing complete power failure', type: 'sos', read: false, createdAt: '2026-04-07T09:00:00Z' },
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
