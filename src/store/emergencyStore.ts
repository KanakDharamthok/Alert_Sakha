import { create } from 'zustand';

export type EmergencyType = 'fire' | 'medical' | 'theft' | 'violence' | 'suspicious' | 'natural_disaster' | 'technical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'active' | 'in_progress' | 'resolved' | 'closed';

export interface Emergency {
  id: string;
  title: string;
  type: EmergencyType;
  severity: Severity;
  status: EmergencyStatus;
  description: string;
  location: string;
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  timeline: { time: string; event: string; by: string }[];
}

const mockEmergencies: Emergency[] = [
  {
    id: '1', title: 'Fire in Kitchen Area', type: 'fire', severity: 'critical', status: 'active',
    description: 'Smoke detected in the main kitchen on floor 2. Staff evacuating guests from nearby rooms.',
    location: 'Floor 2 - Kitchen', reportedBy: 'Maria Santos', assignedTo: 'Fire Response Team',
    createdAt: '2026-04-07T08:30:00Z', updatedAt: '2026-04-07T08:45:00Z',
    timeline: [
      { time: '08:30', event: 'Fire alarm triggered', by: 'System' },
      { time: '08:32', event: 'Staff notified', by: 'Admin' },
      { time: '08:35', event: 'Evacuation started', by: 'Security Team' },
      { time: '08:45', event: 'Fire team dispatched', by: 'Manager' },
    ],
  },
  {
    id: '2', title: 'Medical Emergency - Room 412', type: 'medical', severity: 'high', status: 'in_progress',
    description: 'Guest reported chest pain. First aid team dispatched.',
    location: 'Room 412 - Floor 4', reportedBy: 'Front Desk', assignedTo: 'Medical Team',
    createdAt: '2026-04-07T07:15:00Z', updatedAt: '2026-04-07T07:30:00Z',
    timeline: [
      { time: '07:15', event: 'Emergency call received', by: 'Front Desk' },
      { time: '07:18', event: 'Medical team dispatched', by: 'Manager' },
      { time: '07:22', event: 'First aid administered', by: 'Medical Team' },
    ],
  },
  {
    id: '3', title: 'Theft Report - Lobby', type: 'theft', severity: 'medium', status: 'in_progress',
    description: 'Guest reports missing luggage from lobby area.',
    location: 'Main Lobby', reportedBy: 'Guest - James Wilson', assignedTo: 'Security Team',
    createdAt: '2026-04-07T06:00:00Z', updatedAt: '2026-04-07T06:20:00Z',
    timeline: [
      { time: '06:00', event: 'Theft reported', by: 'Guest' },
      { time: '06:05', event: 'Security reviewing CCTV', by: 'Security Team' },
    ],
  },
  {
    id: '4', title: 'Suspicious Activity - Parking', type: 'suspicious', severity: 'low', status: 'resolved',
    description: 'Unknown vehicle circling the parking lot. Investigated and cleared.',
    location: 'Parking Lot B', reportedBy: 'Security Guard', assignedTo: 'Security Team',
    createdAt: '2026-04-06T22:00:00Z', updatedAt: '2026-04-06T23:00:00Z',
    timeline: [
      { time: '22:00', event: 'Activity reported', by: 'Guard' },
      { time: '22:30', event: 'Vehicle identified as delivery', by: 'Security' },
      { time: '23:00', event: 'Incident resolved', by: 'Manager' },
    ],
  },
  {
    id: '5', title: 'Power Outage - East Wing', type: 'technical', severity: 'high', status: 'active',
    description: 'Complete power failure in east wing affecting 30 rooms.',
    location: 'East Wing - All Floors', reportedBy: 'Maintenance', assignedTo: 'Engineering Team',
    createdAt: '2026-04-07T09:00:00Z', updatedAt: '2026-04-07T09:10:00Z',
    timeline: [
      { time: '09:00', event: 'Power outage detected', by: 'System' },
      { time: '09:05', event: 'Backup generators activated', by: 'Engineering' },
      { time: '09:10', event: 'Investigating main supply', by: 'Engineering Team' },
    ],
  },
];

interface EmergencyState {
  emergencies: Emergency[];
  getEmergency: (id: string) => Emergency | undefined;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  emergencies: mockEmergencies,
  getEmergency: (id: string) => get().emergencies.find(e => e.id === id),
}));
