import React, { useState, useEffect } from 'react';
import type { Thread } from 'matrix-js-sdk';
import './Room.scss';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import settings from '../../../client/state/settings';
import RoomTimeline from '../../../client/state/RoomTimeline';
import navigation from '../../../client/state/navigation';
import { openNavigation } from '../../../client/action/navigation';

import Welcome from '../welcome/Welcome';
import RoomView from './RoomView';
import RoomSettings from './RoomSettings';
import PeopleDrawer from './PeopleDrawer';

interface RoomInfo {
  roomTimeline: RoomTimeline | null;
  eventId: string | null;
  thread: Thread | null;
}

function Room() {
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({
    roomTimeline: null,
    eventId: null,
    thread: null,
  });
  const [isDrawer, setIsDrawer] = useState(settings.isPeopleDrawer);

  const mx = initMatrix.matrixClient;

  useEffect(() => {
    const handleRoomSelected = (
      roomId: string,
      prevRoomId: string,
      eventId: string | null,
      threadId: string | null,
    ) => {
      roomInfo.roomTimeline?.removeInternalListeners();
      if (mx.getRoom(roomId)) {
        const threadTimeline = threadId ? RoomTimeline.newFromThread(threadId, roomId) : null;
        const roomTimeline = threadTimeline ?? new RoomTimeline(roomId);
        setRoomInfo({
          roomTimeline,
          eventId: eventId ?? null,
          thread: null,
        });
      } else {
        // TODO: add ability to join room if roomId is invalid
        setRoomInfo({
          roomTimeline: null,
          eventId: null,
          thread: null,
        });
      }
    };

    navigation.on(cons.events.navigation.ROOM_SELECTED, handleRoomSelected);
    return () => {
      navigation.removeListener(cons.events.navigation.ROOM_SELECTED, handleRoomSelected);
    };
  }, [mx, roomInfo]);

  useEffect(() => {
    const handleDrawerToggling = (visiblity: boolean) => setIsDrawer(visiblity);
    settings.on(cons.events.settings.PEOPLE_DRAWER_TOGGLED, handleDrawerToggling);
    return () => {
      settings.removeListener(cons.events.settings.PEOPLE_DRAWER_TOGGLED, handleDrawerToggling);
    };
  }, []);

  const { roomTimeline, eventId, thread } = roomInfo;
  if (roomTimeline === null) {
    setTimeout(() => openNavigation());
    return <Welcome />;
  }

  return (
    <div className="room">
      <div className="room__content">
        <RoomSettings roomId={roomTimeline.roomId} />
        <RoomView roomTimeline={roomTimeline} eventId={eventId} />
      </div>
      {isDrawer && <PeopleDrawer roomId={roomTimeline.roomId} />}
    </div>
  );
}

export default Room;
