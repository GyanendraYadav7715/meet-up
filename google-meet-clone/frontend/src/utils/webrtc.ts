// utils/webrtc.ts

export const calculateBandwidth = (stats: any) => {
    let bytesReceived = 0;
    let packetsLost = 0;
    let packetsReceived = 0;

    stats.forEach((report: any) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
            bytesReceived += report.bytesReceived || 0;
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
        }
    });

    const packetLoss = packetsReceived > 0 ? (packetsLost / (packetsReceived + packetsLost)) * 100 : 0;

    return {
        bytesReceived,
        packetLoss,
        bitrate: (bytesReceived * 8) / 1000 // roughly kbps 
    };
};

export const adjustBitrate = async (pc: any, maxBitrateKbps: number) => {
    if (!pc) return;
    const senders = pc.getSenders();
    for (const sender of senders) {
        if (sender.track && sender.track.kind === 'video') {
            const parameters = sender.getParameters();
            if (!parameters.encodings || parameters.encodings.length === 0) {
                parameters.encodings = [{}];
            }

            parameters.encodings[0].maxBitrate = maxBitrateKbps * 1000; // bps

            try {
                await sender.setParameters(parameters);
            } catch (e) {
                console.error('Failed to set RTCRtpSender parameters', e);
            }
        }
    }
};
