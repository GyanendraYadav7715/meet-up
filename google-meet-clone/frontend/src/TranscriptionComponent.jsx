import React, { useEffect, useState, useRef } from 'react';

const TranscriptionComponent = ({ socket, isMuted, language = 'en-US', userName }) => {
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn("Web Speech API is not supported in this browser. Fallback to Whisper WASM needed.");
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            if (currentText.trim() === '') return;

            // Emit the caption to the server
            // Only emit 'final' for DB saves, but emit interim for real-time Display
            socket.emit('send-caption', {
                text: currentText,
                senderName: userName,
                language,
                isFinal: !!finalTranscript
            });
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
        };

        recognition.onend = () => {
            // Auto-restart continuous listening unless manually muted
            if (!isMuted && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch(e) {}
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [socket, userName, language]);

    // Handle Mute/Unmute state linking to SpeechRecognition
    useEffect(() => {
        if (!recognitionRef.current || !isSupported) return;

        if (isMuted) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch(e) {} // Ignore already started errors
        }
    }, [isMuted, isSupported]);

    if (!isSupported) {
        return (
             <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,0,0,0.8)', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', zIndex: 1000}}>
                CC Unsupported Browser
            </div>
        );
    }

    // This component renders nothing visible itself naturally; the overlay is handled in MeetingRoom.jsx
    return null;
};

export default TranscriptionComponent;
