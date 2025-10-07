import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar sons do jogo
 */
export function useGameSounds() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playSound = (soundType) => {
    if (!soundEnabled) return;

    try {
      // Simula sons usando Web Audio API ou bibliotecas de som
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      let frequency;
      let duration;
      
      switch (soundType) {
        case 'cardSelect':
          frequency = 800;
          duration = 100;
          break;
        case 'cardSubmit':
          frequency = 1000;
          duration = 200;
          break;
        case 'roundWin':
          frequency = 1200;
          duration = 500;
          break;
        case 'gameWin':
          frequency = 1500;
          duration = 1000;
          break;
        case 'notification':
          frequency = 600;
          duration = 150;
          break;
        case 'error':
          frequency = 300;
          duration = 300;
          break;
        default:
          return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
    } catch (error) {
      console.warn('Som não disponível:', error);
    }
  };

  return {
    soundEnabled,
    setSoundEnabled,
    playSound
  };
}

/**
 * Hook para animações e feedback visual
 */
export function useAnimations() {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = (element, animationClass, duration = 1000) => {
    if (!element) return;

    setIsAnimating(true);
    element.classList.add(animationClass);

    setTimeout(() => {
      element.classList.remove(animationClass);
      setIsAnimating(false);
    }, duration);
  };

  const shakeElement = (element) => {
    triggerAnimation(element, 'shake-animation', 500);
  };

  const bounceElement = (element) => {
    triggerAnimation(element, 'bounce-animation', 600);
  };

  const glowElement = (element) => {
    triggerAnimation(element, 'glow-animation', 1000);
  };

  return {
    isAnimating,
    triggerAnimation,
    shakeElement,
    bounceElement,
    glowElement
  };
}

/**
 * Hook para gerenciar localStorage
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage para key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Erro ao escrever localStorage para key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook para notificações
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}

/**
 * Hook para detecção de dispositivo
 */
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile: screenWidth <= 768,
        isTablet: screenWidth > 768 && screenWidth <= 1024,
        isDesktop: screenWidth > 1024,
        isTouchDevice,
        screenWidth,
        screenHeight
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    
    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);

  return deviceInfo;
}

/**
 * Hook para gerenciar timeout/interval
 */
export function useTimer(callback, delay /*, immediate = false */) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(delay);

  useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1000) {
            setIsActive(false);
            callback();
            return 0;
          }
          return timeLeft - 1000;
        });
      }, 1000);
    } else if (!isActive || timeLeft === 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, callback]);

  const start = (customDelay = delay) => {
    setTimeLeft(customDelay);
    setIsActive(true);
    setIsPaused(false);
  };

  const pause = () => {
    setIsPaused(true);
  };

  const resume = () => {
    setIsPaused(false);
  };

  const stop = () => {
    setIsActive(false);
    setTimeLeft(delay);
  };

  return {
    isActive,
    isPaused,
    timeLeft,
    start,
    pause,
    resume,
    stop
  };
}

/**
 * Hook para copiar texto para clipboard
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.warn('Erro ao copiar para clipboard:', error);
      // Fallback para navegadores mais antigos
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } catch (fallbackError) {
        console.error('Erro no fallback do clipboard:', fallbackError);
        return false;
      }
    }
  };

  return { copied, copyToClipboard };
}