import { useEffect, useRef, useState } from "react";

export function useAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context and get microphone access
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      return stream;
    } catch (err) {
      setError("Failed to access microphone");
      console.error("Audio initialization error:", err);
      throw err;
    }
  };

  // Monitor audio levels
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100));

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  // Start recording
  const startRecording = async (
    onDataAvailable?: (data: Blob) => void
  ): Promise<void> => {
    try {
      const stream = await initializeAudio();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      if (onDataAvailable) {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            onDataAvailable(event.data);
          }
        };
      }

      mediaRecorder.start(100); // Emit data every 100ms
      setIsRecording(true);
      setError(null);

      // Start monitoring audio levels
      monitorAudioLevel();
    } catch (err) {
      setError("Failed to start recording");
      throw err;
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    // Stop monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setAudioLevel(0);
  };

  // Play audio from base64 or blob
  const playAudio = async (audioData: string | Blob) => {
    try {
      let blob: Blob;

      if (typeof audioData === "string") {
        // Assume base64
        const response = await fetch(audioData);
        blob = await response.blob();
      } else {
        blob = audioData;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("Failed to play audio:", err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    playAudio,
  };
}
