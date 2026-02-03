import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

type AudioMetadata = {
    noteId: string | number;
    title: string;
    duration?: number;
};

type AudioContextType = {
    playAudio: (uri: string, metadata: AudioMetadata) => void;
    pauseAudio: () => void;
    stopAudio: () => void;
    isPlaying: boolean;
    currentUri: string | null;
    currentMetadata: AudioMetadata | null;
    progress: number;
};

const AudioContext = createContext<AudioContextType>({
    playAudio: () => { },
    pauseAudio: () => { },
    stopAudio: () => { },
    isPlaying: false,
    currentUri: null,
    currentMetadata: null,
    progress: 0,
});

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentUri, setCurrentUri] = useState<string | null>(null);
    const [currentMetadata, setCurrentMetadata] = useState<AudioMetadata | null>(null);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = (uri: string, metadata: AudioMetadata) => {
        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(uri);
        audioRef.current = audio;
        setCurrentUri(uri);
        setCurrentMetadata(metadata);

        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        });

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setProgress(0);
        });

        audio.play();
        setIsPlaying(true);
    };

    const pauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setProgress(0);
        }
    };

    return (
        <AudioContext.Provider
            value={{
                playAudio,
                pauseAudio,
                stopAudio,
                isPlaying,
                currentUri,
                currentMetadata,
                progress,
            }}
        >
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => useContext(AudioContext);
