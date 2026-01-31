
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerTime {
  name: PrayerName;
  time: Date;
  completed: boolean;
  reminderSent: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface DailyLog {
  date: string; // ISO format
  prayers: Record<PrayerName, boolean>;
}
