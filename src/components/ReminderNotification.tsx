import React, { useEffect, useRef } from 'react';
import { getNotes } from '../services/offlineApi';

const CHECK_INTERVAL = 10000; // Check every 10 seconds
const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const ReminderNotification: React.FC = () => {
    const notifiedRef = useRef<Set<string | number>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        console.log('🔔 [Reminder] Monitor mounted');

        if ('Notification' in window && Notification.permission === 'default') {
            console.log('🔔 [Reminder] Permission is default, requesting...');
            Notification.requestPermission();
        }

        audioRef.current = new Audio(ALERT_SOUND_URL);
        audioRef.current.load();

        const checkReminders = async () => {
            try {
                const notes = await getNotes();
                const now = new Date();

                // Track notes with reminders for debugging
                const allNotesWithAnyReminderProperty = notes.filter(n => n.reminder || n.reminder_at);

                if (allNotesWithAnyReminderProperty.length > 0) {
                    console.log(`🔔 [Reminder] Found ${allNotesWithAnyReminderProperty.length} total notes with reminder data.`);
                }

                notes.forEach((note) => {
                    const remindAt = note.reminder?.remind_at || note.reminder_at;
                    if (!remindAt || note.is_archived || note.is_deleted) return;

                    const reminderTime = new Date(remindAt);
                    const timeDiff = now.getTime() - reminderTime.getTime();

                    // Trigger if:
                    // 1. Current time is past reminder time (timeDiff >= 0)
                    // 2. Reminder is not extremely old (within the last 30 minutes)
                    // 3. We haven't notified for this ID already
                    if (timeDiff >= 0 && timeDiff < 1800000 && !notifiedRef.current.has(note.id)) {
                        triggerNotification(note);
                        notifiedRef.current.add(note.id);
                    }
                });
            } catch (err) {
                console.error('❌ [Reminder] Check failed:', err);
            }
        };

        const triggerNotification = (note: any) => {
            console.log('📢 [Reminder] Triggering notification & audio...');

            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    const notification = new Notification('Homa Reminder: ' + (note.title || 'Note'), {
                        body: note.content?.substring(0, 80) || 'You have a scheduled reminder!',
                        icon: '/vite.svg',
                        tag: `reminder-${note.id}`,
                        requireInteraction: true
                    });

                    notification.onclick = () => {
                        window.focus();
                        window.location.href = `/notes/edit/${note.id}`;
                        notification.close();
                    };
                } catch (e) {
                    console.error('❌ [Reminder] Browser notification failed:', e);
                }
            } else {
                console.warn('⚠️ [Reminder] Notification permission not granted:', Notification.permission);
            }

            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => {
                    console.warn('⚠️ [Reminder] Audio playback failed. Check browser autoplay settings.', err);
                });
            }
        };

        const initialCheck = setTimeout(checkReminders, 2000);
        const interval = setInterval(checkReminders, CHECK_INTERVAL);

        return () => {
            clearTimeout(initialCheck);
            clearInterval(interval);
        };
    }, []);

    return null;
};

export default ReminderNotification;
