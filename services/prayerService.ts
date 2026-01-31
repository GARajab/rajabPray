
import { PrayerName, PrayerTime } from '../types';

/**
 * A simplified prayer time calculator. 
 * In a production app, we would use 'adhan' library, 
 * but for this SPA we implement a lightweight version.
 */
export const calculatePrayerTimes = (
  lat: number,
  lng: number,
  date: Date = new Date()
): Record<PrayerName, Date> => {
  // Simplified calculation logic based on solar declination and local noon
  // In reality, this is complex spherical trigonometry.
  // This mock calculation provides deterministic times relative to local noon.
  
  const baseDate = new Date(date);
  baseDate.setHours(12, 0, 0, 0); // Start at solar noon (roughly)

  // Adjustments based on longitude (very rough approximation)
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  const lonCorrection = (lng / 15) - (timezoneOffset);
  const solarNoon = new Date(baseDate.getTime() - lonCorrection * 3600000);

  const setTime = (hours: number, mins: number) => {
    const d = new Date(solarNoon);
    d.setHours(d.getHours() + hours);
    d.setMinutes(d.getMinutes() + mins);
    return d;
  };

  return {
    Fajr: setTime(-6, -30),
    Dhuhr: setTime(0, 15),
    Asr: setTime(3, 30),
    Maghrib: setTime(6, 10),
    Isha: setTime(7, 45),
  };
};

export const getNextPrayer = (times: Record<PrayerName, Date>): PrayerName => {
  const now = new Date();
  const order: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  for (const name of order) {
    if (times[name] > now) return name;
  }
  return 'Fajr'; // If all passed, next is tomorrow's Fajr
};
