export interface BandwidthStats {
    timestamp: number;
    bytesReceived: number;
    bytesSent: number;
    estimatedBandwidth?: number;
    packetLoss?: number;
}

export const estimateBandwidth = async (pc: RTCPeerConnection, lastStats?: BandwidthStats): Promise<BandwidthStats | null> => {
    if (!pc) return null;
    try {
        const stats = await pc.getStats();
        let bytesReceived = 0;
        let bytesSent = 0;
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                bytesReceived += report.bytesReceived || 0;
                packetsLost += report.packetsLost || 0;
                packetsReceived += report.packetsReceived || 0;
            }
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
                bytesSent += report.bytesSent || 0;
            }
        });

        const currentTimestamp = Date.now();
        const result: BandwidthStats = {
            timestamp: currentTimestamp,
            bytesReceived,
            bytesSent,
        };

        if (lastStats) {
            const timeDiff = (currentTimestamp - lastStats.timestamp) / 1000; // seconds
            if (timeDiff > 0) {
                const bytesDiff = bytesReceived - lastStats.bytesReceived;
                result.estimatedBandwidth = (bytesDiff * 8) / timeDiff; // bps

                const totalPackets = packetsReceived + packetsLost;
                if (totalPackets > 0) {
                    result.packetLoss = packetsLost / totalPackets;
                }
            }
        }

        return result;
    } catch (err) {
        console.error('Error getting WebRTC stats:', err);
        return null;
    }
};

/**
 * Dynamically adjusts user's video tracks based on network conditions
 */
export const adjustBitrate = (stream: MediaStream, bandwidthBps: number, packetLoss: number) => {
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;

    const track = videoTracks[0];
    const capabilities = track.getCapabilities?.(); // Browser check

    if (packetLoss > 0.1 || bandwidthBps < 200000) { // < 200 kbps or > 10% packet loss
        // Throttle: Very low quality or disable if extreme
        console.warn(`[Network] Poor connection detected (Loss: ${(packetLoss * 100).toFixed(1)}%, BW: ${(bandwidthBps / 1000).toFixed(1)}kbps). Throttling video.`);
        try {
            track.applyConstraints({
                frameRate: { max: 10 },
                width: { max: 320 },
                height: { max: 240 }
            });
        } catch (e) { }
    } else if (bandwidthBps > 1000000) { // > 1 Mbps
        // Good network
        console.log(`[Network] Good connection. Restoring video quality.`);
        try {
            track.applyConstraints({
                frameRate: { ideal: 30 },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            });
        } catch (e) { }
    }
};
