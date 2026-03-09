import { useSelector, useDispatch } from 'react-redux';
import {
    setRoomId,
    toggleMute,
    toggleVideo,
    setScreenSharing,
    toggleChat,
    setRecordingStatus,
    toggleCaptions,
    addSfuParticipant,
    leaveMeetingReset
} from '../store/slices/meetingSlice';
import { useCallback } from 'react';

export const useMeeting = () => {
    const dispatch = useDispatch();
    const meetingState = useSelector((state) => state.meeting);

    const handleSetRoomId = useCallback((id) => dispatch(setRoomId(id)), [dispatch]);
    const handleToggleMute = useCallback(() => dispatch(toggleMute()), [dispatch]);
    const handleToggleVideo = useCallback(() => dispatch(toggleVideo()), [dispatch]);
    const handleSetScreenSharing = useCallback((status) => dispatch(setScreenSharing(status)), [dispatch]);
    const handleToggleChat = useCallback(() => dispatch(toggleChat()), [dispatch]);
    const handleSetRecordingStatus = useCallback((status) => dispatch(setRecordingStatus(status)), [dispatch]);
    const handleToggleCaptions = useCallback(() => dispatch(toggleCaptions()), [dispatch]);
    const handleAddSfuParticipant = useCallback((id) => dispatch(addSfuParticipant(id)), [dispatch]);
    const handleLeaveMeeting = useCallback(() => dispatch(leaveMeetingReset()), [dispatch]);

    return {
        ...meetingState,
        setRoomId: handleSetRoomId,
        toggleMute: handleToggleMute,
        toggleVideo: handleToggleVideo,
        setScreenSharing: handleSetScreenSharing,
        toggleChat: handleToggleChat,
        setRecordingStatus: handleSetRecordingStatus,
        toggleCaptions: handleToggleCaptions,
        addSfuParticipant: handleAddSfuParticipant,
        leaveMeeting: handleLeaveMeeting
    };
};
