// Simple Web Speech API hook for voice-to-text
import { useEffect, useRef, useState } from 'react';

export default function useSpeechRecognition({ lang = 'en-IN', interim = true } = {}) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState('');
  const [currentLang, setCurrentLang] = useState(lang);

  // Initialize or recreate recognition when language/settings change
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SpeechRecognition();
    rec.lang = currentLang; // e.g., 'en-IN', 'hi-IN', 'mr-IN'
    rec.interimResults = interim;
    rec.continuous = true; // allow longer dictation
    // Some engines support this for better hypotheses
    try { rec.maxAlternatives = 3; } catch (_) {}

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e) => setError(e?.error || 'speech_error');

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch (_) {}
    };
  }, [currentLang, interim]);

  const setLang = (l) => {
    setCurrentLang(l);
  };

  const start = () => {
    setError('');
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (_) {}
  };
  const stop = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
  };

  const attachResultHandler = (cb) => {
    // cb receives final transcript string
    const rec = recognitionRef.current;
    if (!rec) return () => {};
    const handler = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript;
        }
      }
      if (finalText) cb(finalText.trim());
    };
    rec.onresult = handler;
    return () => {
      if (rec) rec.onresult = null;
    };
  };

  return { supported, listening, error, start, stop, attachResultHandler, setLang, lang: currentLang };
}
