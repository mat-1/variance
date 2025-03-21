import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './RoomView.scss';

import EventEmitter from 'events';

import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';

import RoomViewHeader from './RoomViewHeader';
import RoomViewContent from './RoomViewContent';
import RoomViewFloating from './RoomViewFloating';
import RoomViewInput from './RoomViewInput';
import RoomViewCmdBar from './RoomViewCmdBar';
import RoomTimeline from '../../../client/state/RoomTimeline';

const viewEvent = new EventEmitter();

function RoomView({
  roomTimeline,
  eventId = null,
}: {
  roomTimeline: RoomTimeline;
  eventId: string | null;
}) {
  const roomViewRef = useRef(null);
  // eslint-disable-next-line react/prop-types
  const { roomId, threadId } = roomTimeline;

  useEffect(() => {
    const settingsToggle = (isVisible) => {
      const roomView = roomViewRef.current;
      roomView.classList.toggle('room-view--dropped');

      const roomViewContent = roomView.children[1];
      if (isVisible) {
        setTimeout(() => {
          if (!navigation.isRoomSettings) return;
          roomViewContent.style.visibility = 'hidden';
        }, 200);
      } else roomViewContent.style.visibility = 'visible';
    };
    navigation.on(cons.events.navigation.ROOM_SETTINGS_TOGGLED, settingsToggle);
    return () => {
      navigation.removeListener(cons.events.navigation.ROOM_SETTINGS_TOGGLED, settingsToggle);
    };
  }, []);

  return (
    <div className="room-view" ref={roomViewRef}>
      <RoomViewHeader roomId={roomId} threadId={threadId} />
      <div className="room-view__content-wrapper">
        <div className="room-view__scrollable">
          <RoomViewContent eventId={eventId} roomTimeline={roomTimeline} />
          <RoomViewFloating roomId={roomId} roomTimeline={roomTimeline} />
        </div>
        <div className="room-view__sticky">
          <RoomViewInput
            roomId={roomId}
            threadId={threadId}
            roomTimeline={roomTimeline}
            viewEvent={viewEvent}
          />
          <RoomViewCmdBar roomId={roomId} roomTimeline={roomTimeline} viewEvent={viewEvent} />
        </div>
      </div>
    </div>
  );
}

RoomView.propTypes = {
  roomTimeline: PropTypes.shape({}).isRequired,
  eventId: PropTypes.string,
};

export default RoomView;
