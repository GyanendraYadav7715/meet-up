import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    roomId: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    isChatOpen: false,
    isRecording: false,
    isCaptionsEnabled: false,
    sfuParticipants: [],
    peers: [], // Note: storing complex objects like Peer instances in Redux is an anti-pattern. We'll store simple metadata here if needed, but peer instances remain in refs.
};

const meetingSlice = createSlice({
    name: 'meeting',
    initialState,
    reducers: {
        setRoomId: (state, action) => {
            state.roomId = action.payload;
        },
        toggleMute: (state) => {
            state.isMuted = !state.isMuted;
        },
        toggleVideo: (state) => {
            state.isVideoOff = !state.isVideoOff;
        },
        setScreenSharing: (state, action) => {
            state.isScreenSharing = action.payload;
        },
        toggleChat: (state) => {
            state.isChatOpen = !state.isChatOpen;
        },
        setRecordingStatus: (state, action) => {
            state.isRecording = action.payload;
        },
        toggleCaptions: (state) => {
            state.isCaptionsEnabled = !state.isCaptionsEnabled;
        },
        addSfuParticipant: (state, action) => {
            if (!state.sfuParticipants.includes(action.payload)) {
                state.sfuParticipants.push(action.payload);
            }
        },
        leaveMeetingReset: (state) => {
            return initialState;
        }
    },
});

export const {
    setRoomId,
    toggleMute,
    toggleVideo,
    setScreenSharing,
    toggleChat,
    setRecordingStatus,
    toggleCaptions,
    addSfuParticipant,
    leaveMeetingReset
} = meetingSlice.actions;

export default meetingSlice.reducer;
