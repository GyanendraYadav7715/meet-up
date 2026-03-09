import { estimateBandwidth, adjustBitrate } from '../src/utils/bandwidth';

describe('WebRTC Bandwidth optimization', () => {
    it('estimates bandwidth correctly given two stats payloads', async () => {
        const mockPc = {
            getStats: jest.fn().mockResolvedValue([
                { type: 'inbound-rtp', kind: 'video', bytesReceived: 500000, packetsReceived: 450, packetsLost: 50 },
                { type: 'outbound-rtp', kind: 'video', bytesSent: 200000 }
            ])
        };

        const lastStats = {
            timestamp: Date.now() - 5000, // 5 seconds ago
            bytesReceived: 100000,
            bytesSent: 50000
        };

        const result = await estimateBandwidth(mockPc as any, lastStats);

        expect(result).not.toBeNull();
        expect(result?.bytesReceived).toBe(500000);
        expect(result?.bytesSent).toBe(200000);
        // (500000 - 100000) * 8 / 5 = 640000 bps
        expect(result?.estimatedBandwidth).toBe(640000);
        // 50 lost / 500 total = 10% packet loss
        expect(result?.packetLoss).toBe(0.1);
    });

    it('throttles bitrate when bandwidth is low or packet loss is high', () => {
        const mockApplyConstraints = jest.fn();
        const mockStream = {
            getVideoTracks: () => [{
                applyConstraints: mockApplyConstraints,
                getCapabilities: () => ({})
            }]
        };

        // Test throttling condition
        adjustBitrate(mockStream as any, 150000, 0.15);
        expect(mockApplyConstraints).toHaveBeenCalledWith({
            frameRate: { max: 10 },
            width: { max: 320 },
            height: { max: 240 }
        });

        mockApplyConstraints.mockClear();

        // Test restoring condition
        adjustBitrate(mockStream as any, 1500000, 0.01);
        expect(mockApplyConstraints).toHaveBeenCalledWith({
            frameRate: { ideal: 30 },
            width: { ideal: 1280 },
            height: { ideal: 720 }
        });
    });
});
