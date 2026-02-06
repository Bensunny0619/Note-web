import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, RotateCcw } from 'lucide-react';

type AudioRecorderProps = {
    onAudioRecorded: (uri: string) => void;
    onAudioDeleted?: () => void;
    existingAudioUri?: string;
};

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, onAudioDeleted, existingAudioUri }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUri, setAudioUri] = useState<string | null>(existingAudioUri || null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

                // Convert blob to Data URL (Base64) for persistence in IndexedDB
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = reader.result as string;
                    setAudioUri(base64Data);
                    onAudioRecorded(base64Data);
                };
                reader.readAsDataURL(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const deleteRecording = () => {
        if (audioUri) {
            URL.revokeObjectURL(audioUri);
            setAudioUri(null);
            onAudioDeleted?.();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayback = () => {
        if (!audioPlayerRef.current) return;

        if (isPlaying) {
            audioPlayerRef.current.pause();
        } else {
            audioPlayerRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
            {!audioUri && !isRecording ? (
                <button
                    onClick={startRecording}
                    className="w-full flex items-center justify-center gap-3 py-4 text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Mic className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">Start Audio Note</span>
                </button>
            ) : isRecording ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-lg font-mono font-bold text-gray-700 dark:text-gray-300">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                    >
                        <Square className="w-6 h-6 fill-current" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlayback}
                        className="p-3 bg-primary text-white rounded-full shadow-lg hover:shadow-primary/25 transition-all"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1">
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-0 transition-all duration-100" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (audioPlayerRef.current) {
                                    audioPlayerRef.current.currentTime = 0;
                                    audioPlayerRef.current.play();
                                    setIsPlaying(true);
                                }
                            }}
                            className="p-2 text-gray-500 hover:text-primary transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={deleteRecording}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <audio
                        ref={audioPlayerRef}
                        src={audioUri || ''}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
