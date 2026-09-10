import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE_INTERVAL = 5000;   // 5 detik — setengah dari 2.5s semula
const MAX_INTERVAL  = 30000;  // backoff maks 30 detik saat error network

export function useParticipantRealtime({ bimtekId = null, onParticipantRegistered = null, onAttendanceRecorded = null } = {}) {
  const [isConnected, setIsConnected]         = useState(true);
  const [latestNotification, setLatestNotification] = useState(null);
  const [recentEvents, setRecentEvents]       = useState([]);

  const lastTimeRef        = useRef(Date.now() / 1000);
  const processedEventIds  = useRef(new Set());
  const intervalRef        = useRef(null);
  const retryDelayRef      = useRef(BASE_INTERVAL);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;

    const checkRealtimeEvents = async () => {
      try {
        const response = await axios.get('/admin/realtime-poll', {
          params:  { since: lastTimeRef.current },
          timeout: 4000,
        });

        if (!isSubscribed) return;

        setIsConnected(true);
        retryDelayRef.current = BASE_INTERVAL; // reset backoff saat sukses

        const data = response.data;
        if (data?.current_time) lastTimeRef.current = data.current_time;

        if (!Array.isArray(data?.events) || data.events.length === 0) return;

        data.events.forEach((ev) => {
          if (processedEventIds.current.has(ev.id)) return;
          processedEventIds.current.add(ev.id);

          if (ev.event === 'ParticipantRegistered') {
            const pData = ev.data;
            if (bimtekId && Number(pData.bimtek_id) !== Number(bimtekId)) return;

            setLatestNotification(pData);
            setRecentEvents((prev) => [pData, ...prev].slice(0, 20));
            onParticipantRegistered?.(pData);

            setTimeout(() => {
              setLatestNotification((cur) => (cur?.id === pData.id ? null : cur));
            }, 7000);
          }

          if (ev.event === 'AttendanceRecorded') {
            onAttendanceRecorded?.(ev.data);
          }
        });
      } catch (err) {
        if (!isSubscribed) return;

        if (err.response?.status === 403 || err.response?.status === 401) {
          setIsConnected(false);
          return; // berhenti polling saat unauthorized
        }

        // Error jaringan: exponential backoff, jadwalkan ulang manual
        if (intervalRef.current) clearInterval(intervalRef.current);
        retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, MAX_INTERVAL);
        intervalRef.current = setInterval(checkRealtimeEvents, retryDelayRef.current);
      }
    };

    // Cek awal langsung
    checkRealtimeEvents();

    // Interval normal 5 detik
    intervalRef.current = setInterval(checkRealtimeEvents, BASE_INTERVAL);

    return () => {
      isSubscribed = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bimtekId, onParticipantRegistered, onAttendanceRecorded]);

  return {
    isConnected,
    latestNotification,
    clearNotification: () => setLatestNotification(null),
    recentEvents,
  };
}
