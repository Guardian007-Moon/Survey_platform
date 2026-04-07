import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes

export function useSessionShield() {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only start timer if token exists
    if (localStorage.getItem('adminToken')) {
      timeoutRef.current = setTimeout(logout, TIMEOUT_DURATION);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => resetTimer();

    // Attach listeners
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Initial start
    resetTimer();

    return () => {
      // Cleanup
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  return { resetTimer, logout };
}
