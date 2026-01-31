
import React, { useState, useEffect, useCallback } from 'react';
import { PrayerName, PrayerTime, UserLocation } from './types';
import { calculatePrayerTimes, getNextPrayer } from './services/prayerService';
import { getDailyInspiration } from './services/geminiService';
import PrayerCard from './components/PrayerCard';

const App: React.FC = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [prayers, setPrayers] = useState<Record<PrayerName, PrayerTime> | null>(null);
  const [inspiration, setInspiration] = useState<string>('Finding inspiration for your journey...');
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Load initial state from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('nur_prayers_v1');
    const todayStr = new Date().toDateString();
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === todayStr) {
        const hydrated: any = {};
        Object.keys(parsed.prayers).forEach(key => {
          hydrated[key] = {
            ...parsed.prayers[key],
            time: new Date(parsed.prayers[key].time)
          };
        });
        setPrayers(hydrated);
      }
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      }, (err) => {
        console.error("Location error:", err);
        setLocation({ latitude: 21.4225, longitude: 39.8262 }); // Default to Mecca
      });
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  useEffect(() => {
    if (location && !prayers) {
      const times = calculatePrayerTimes(location.latitude, location.longitude);
      const initialPrayers: Record<string, PrayerTime> = {};
      
      (Object.keys(times) as PrayerName[]).forEach((name) => {
        initialPrayers[name] = {
          name,
          time: times[name],
          completed: false,
          reminderSent: false
        };
      });
      
      setPrayers(initialPrayers as Record<PrayerName, PrayerTime>);
      const next = getNextPrayer(times);
      getDailyInspiration(next).then(setInspiration);
    }
  }, [location, prayers]);

  useEffect(() => {
    if (prayers) {
      localStorage.setItem('nur_prayers_v1', JSON.stringify({
        date: new Date().toDateString(),
        prayers
      }));
    }
  }, [prayers]);

  // Check for prayer times every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!prayers) return;
      
      const now = new Date();
      let updated = false;
      const newPrayers = { ...prayers };

      (Object.keys(newPrayers) as PrayerName[]).forEach(name => {
        const prayer = newPrayers[name];
        if (now > prayer.time && !prayer.reminderSent && !prayer.completed) {
          triggerNotification(name);
          newPrayers[name].reminderSent = true;
          updated = true;
        }
      });

      if (updated) {
        setPrayers(newPrayers);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [prayers]);

  const triggerNotification = (name: PrayerName) => {
    const message = `It is time for ${name}. Track your progress.`;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Nur Reminder', { 
          body: message,
          icon: 'https://cdn-icons-png.flaticon.com/512/3663/3663361.png'
        });
      } catch (e) {
        // Fallback for some browsers that require ServiceWorker notifications
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Nur Reminder', { body: message });
        });
      }
    }
    
    setLastNotification(name);
    setShowNotificationModal(true);
  };

  const togglePrayer = (name: PrayerName) => {
    if (!prayers) return;
    setPrayers({
      ...prayers,
      [name]: { ...prayers[name], completed: !prayers[name].completed }
    });
    
    if (showNotificationModal && lastNotification === name) {
      setShowNotificationModal(false);
    }
  };

  if (!prayers) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Determining prayer times...</p>
        </div>
      </div>
    );
  }

  const prayerList = (Object.values(prayers) as PrayerTime[]).sort((a, b) => a.time.getTime() - b.time.getTime());
  const nextName = getNextPrayer(calculatePrayerTimes(location?.latitude || 0, location?.longitude || 0));
  const completedCount = prayerList.filter(p => p.completed).length;

  return (
    <div className="min-h-screen pb-32 bg-[#F2F2F7]">
      {/* Notification Permission Banner */}
      {notificationPermission === 'default' && (
        <div className="bg-blue-600 text-white p-4 text-center sticky top-0 z-50 animate-slide-down shadow-lg">
          <p className="text-sm font-medium mb-2">Enable notifications to receive prayer reminders.</p>
          <button 
            onClick={requestNotificationPermission}
            className="bg-white text-blue-600 px-6 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform"
          >
            Enable Notifications
          </button>
        </div>
      )}

      <header className="px-6 pt-12 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-3xl font-bold text-gray-900">Today</h1>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-blue-500">{completedCount}</span>
              <span className="text-gray-400 font-medium">/5</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-700 ease-out"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 space-y-6">
        <section className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest">Inspiration</span>
          </div>
          <p className="text-lg font-medium italic leading-snug">"{inspiration}"</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 ml-1">Daily Prayers</h2>
          {prayerList.map((prayer) => (
            <PrayerCard
              key={prayer.name}
              name={prayer.name}
              time={prayer.time}
              completed={prayer.completed}
              isNext={prayer.name === nextName}
              onToggle={() => togglePrayer(prayer.name)}
            />
          ))}
        </section>

        <div className="text-center pb-10">
           <p className="text-[10px] text-gray-400 font-medium">Location: {location?.latitude.toFixed(2)}, {location?.longitude.toFixed(2)}</p>
           <p className="text-[10px] text-gray-400 mt-1">Add to Home Screen for best experience</p>
        </div>
      </main>

      {showNotificationModal && lastNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Time for {lastNotification}</h3>
              <p className="text-gray-500 mb-6 text-sm">You finished your prayer. Click below to mark it as done and maintain your streak.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => togglePrayer(lastNotification as PrayerName)}
                  className="w-full py-3 bg-blue-500 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg"
                >
                  Mark as Prayed
                </button>
                <button 
                  onClick={() => setShowNotificationModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 ios-blur border-t border-gray-100 safe-area-bottom z-40">
        <div className="max-w-md mx-auto px-10 py-3 flex justify-between items-center">
          <button className="flex flex-col items-center gap-1 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.75 2.25a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0V2.25zM16.112 5.388a.75.75 0 00-1.06 1.06l1.591 1.591a.75.75 0 001.06-1.06l-1.591-1.591zM21.75 11.25a.75.75 0 000 1.5h-2.25a.75.75 0 000-1.5h2.25zM17.703 16.112a.75.75 0 10-1.06 1.06l1.591 1.591a.75.75 0 101.06-1.06l-1.591-1.591zM12.75 19.5a.75.75 0 00-1.5 0v2.25a.75.75 0 001.5 0V19.5zM7.888 16.112a.75.75 0 00-1.06-1.06l-1.591 1.591a.75.75 0 001.06 1.06l1.591-1.591zM4.5 11.25a.75.75 0 000 1.5h2.25a.75.75 0 000-1.5H4.5zM7.888 5.388a.75.75 0 00-1.06 1.06l1.591 1.591a.75.75 0 001.06-1.06L7.888 5.388z" /><path fillRule="evenodd" d="M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM3 12a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" /></svg>
            <span className="text-[10px] font-bold">Today</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[10px] font-bold">History</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
