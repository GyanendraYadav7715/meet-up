import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { estimateBandwidth, adjustBitrate, BandwidthStats } from '../utils/bandwidth';

// In production, this key should be dynamically exchanged via secure channel, not hardcoded.
const SIGNALING_ENCRYPTION_KEY = 'webrtc-secure-key-mvp';

interface PeerObj {
    peerID: string;
    peer: any; // Peer instance
}

export const useWebRTCOptimized = (socket: Socket, roomId: string, stream: MediaStream | undefined) => {
    const [peers, setPeers] = useState<PeerObj[]>([]);
    const peersRef = useRef<PeerObj[]>([]);
    const [isSFUMode, setIsSFUMode] = useState(false);

    // Bandwidth monitoring
    const statsRef = useRef<Record<string, BandwidthStats>>({});

    useEffect(() => {
        if (!stream) return;

        socket.emit('join-room', roomId, socket.id as string);

        socket.on('room-info', ({ peerCount }) => {
            if (peerCount > 4) {
                console.log('Room size > 4. Switching to SFU simulation mode.');
                setIsSFUMode(true);
            }
        });

        socket.on('user-connected', (userId: string, peerCount: number) => {
            if (peerCount > 4) {
                setIsSFUMode(true);
                return; // Do not create a new P2P mesh connection
            }

            const peer = createPeer(userId, socket.id, stream);
            peersRef.current.push({ peerID: userId, peer });
            setPeers([...peersRef.current]);
        });

        socket.on('user-joined', (payload: { signal: string, callerID: string }) => {
            if (isSFUMode) return; // Ignore incoming P2P requests if we are in SFU mode

            // Decrypt signal
            const bytes = CryptoJS.AES.decrypt(payload.signal, SIGNALING_ENCRYPTION_KEY);
            const decryptedSignal = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

            const peer = addPeer(decryptedSignal, payload.callerID, stream);
            peersRef.current.push({ peerID: payload.callerID, peer });
            setPeers([...peersRef.current]);
        });

        socket.on('receiving-returned-signal', (payload: { signal: string, id: string }) => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) {
                // Decrypt returned signal
                const bytes = CryptoJS.AES.decrypt(payload.signal, SIGNALING_ENCRYPTION_KEY);
                const decryptedSignal = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                item.peer.signal(decryptedSignal);
            }
        });

        socket.on('user-disconnected', (userId: string) => {
            const peerObj = peersRef.current.find(p => p.peerID === userId);
            if (peerObj) {
                peerObj.peer.destroy();
            }
            peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
            setPeers([...peersRef.current]);
        });

        return () => {
            socket.emit('leave-room', roomId, socket.id);
            socket.off('user-connected');
            socket.off('user-joined');
            socket.off('receiving-returned-signal');
            socket.off('user-disconnected');
            socket.off('room-info');
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, [roomId, stream, isSFUMode]);

    // Polling for getStats every 5s
    useEffect(() => {
        if (isSFUMode || !stream) return;

        const interval = setInterval(() => {
            peersRef.current.forEach(async ({ peerID, peer }) => {
                // simple-peer instance stores the native RTCPeerConnection at _pc
                const pc = (peer as any)._pc as RTCPeerConnection;
                if (!pc) return;

                const lastStats = statsRef.current[peerID];
                const stats = await estimateBandwidth(pc, lastStats);

                if (stats) {
                    statsRef.current[peerID] = stats;
                    if (stats.estimatedBandwidth !== undefined && stats.packetLoss !== undefined) {
                        adjustBitrate(stream, stats.estimatedBandwidth, stats.packetLoss);
                    }
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [stream, isSFUMode]);

    // SFU Recording & Relaying (Simulation) logic for > 4 peers
    useEffect(() => {
        if (!isSFUMode || !stream) return;

        let mediaRecorder: MediaRecorder | null = null;
        try {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
        } catch (e) {
            console.warn('VP8 codec not supported, falling back to default webm');
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        }

        mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0) {
                const buffer = await e.data.arrayBuffer();
                socket.emit('relay-media', {
                    roomId,
                    chunk: buffer,
                    type: mediaRecorder?.mimeType,
                    senderId: socket.id
                });
            }
        };

        // Emit chunks every 100ms for low latency
        mediaRecorder.start(100);

        return () => {
            if (mediaRecorder?.state === 'recording') {
                mediaRecorder.stop();
            }
        };
    }, [isSFUMode, stream, roomId]);

    function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'target:stun:global.stun.twilio.com:3478' }
                ],
                iceTransportPolicy: 'relay', // Strictly enforce TURN relay to prevent local IP address leakage
            }
        });

        peer.on('signal', (signal: any) => {
            const encryptedSignal = CryptoJS.AES.encrypt(JSON.stringify(signal), SIGNALING_ENCRYPTION_KEY).toString();
            socket.emit('sending-signal', { userToSignal, callerID, signal: encryptedSignal });
        });

        return peer;
    }

    function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ],
                iceTransportPolicy: 'relay', // Strictly enforce TURN relay
            }
        });

        peer.on('signal', (signal: any) => {
            const encryptedSignal = CryptoJS.AES.encrypt(JSON.stringify(signal), SIGNALING_ENCRYPTION_KEY).toString();
            socket.emit('returning-signal', { signal: encryptedSignal, callerID });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    return { peers, isSFUMode, setPeers, peersRef };
};
