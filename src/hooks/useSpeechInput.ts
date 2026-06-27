import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MAX_DURATION_MS = 45000;

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechInput(
  onTranscript: (text: string) => void,
  maxDurationMs = DEFAULT_MAX_DURATION_MS
) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);
  const accumulatedRef = useRef('');
  const baseTextRef = useRef('');
  const endTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    setSecondsLeft(0);
    setListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, [clearTimer]);

  const startRecognition = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor || !activeRef.current) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedRef.current = `${accumulatedRef.current} ${piece}`.trim();
        } else {
          interim += piece;
        }
      }
      const combined = `${accumulatedRef.current}${interim ? ` ${interim}` : ''}`.trim();
      if (combined) {
        onTranscriptRef.current(
          baseTextRef.current ? `${baseTextRef.current} ${combined}` : combined
        );
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (activeRef.current && Date.now() < endTimeRef.current) {
        window.setTimeout(() => {
          if (activeRef.current) startRecognition();
        }, 200);
      } else {
        stop();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      stop();
    }
  }, [stop]);

  const start = useCallback(
    (existingText = '') => {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionCtor) return;

      stop();
      activeRef.current = true;
      accumulatedRef.current = '';
      baseTextRef.current = existingText.trim();
      endTimeRef.current = Date.now() + maxDurationMs;
      setListening(true);
      setSecondsLeft(Math.ceil(maxDurationMs / 1000));

      clearTimer();
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) stop();
      }, 500);

      startRecognition();
    },
    [clearTimer, maxDurationMs, startRecognition, stop]
  );

  const toggle = useCallback(
    (existingText = '') => {
      if (listening) stop();
      else start(existingText);
    },
    [listening, start, stop]
  );

  useEffect(() => () => {
    activeRef.current = false;
    clearTimer();
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }
  }, [clearTimer]);

  return { listening, supported, secondsLeft, toggle, stop, start };
}
