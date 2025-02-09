import { EventType, MatrixEvent, RoomMember } from 'matrix-js-sdk';
import initMatrix from '../client/initMatrix';

export function roomIdByActivity(id1: string, id2: string) {
  return getLastMessageTimestamp(id2) - getLastMessageTimestamp(id1);
}

function getLastMessageTimestamp(roomId: string) {
  // getLastActiveTimestamp counts any event so we do this instead

  const room = initMatrix.matrixClient.getRoom(roomId)!;

  const timeline = room.getLiveTimeline();
  const events = timeline.getEvents();
  if (events.length) {
    const ev = events
      .slice()
      .reverse()
      .find((event: MatrixEvent) => event.getType() === EventType.RoomMessage);
    if (ev) {
      return ev.getTs();
    }
  }

  return Number.MIN_SAFE_INTEGER;
}

export function roomIdByAtoZ(aId: string, bId: string) {
  let aName = initMatrix.matrixClient.getRoom(aId)!.name;
  let bName = initMatrix.matrixClient.getRoom(bId)!.name;

  // remove "#" from the room name
  // To ignore it in sorting
  aName = aName.replace(/#/g, '');
  bName = bName.replace(/#/g, '');

  if (aName.toLowerCase() < bName.toLowerCase()) {
    return -1;
  }
  if (aName.toLowerCase() > bName.toLowerCase()) {
    return 1;
  }
  return 0;
}

export function memberByAtoZ(m1: RoomMember, m2: RoomMember) {
  const aName = m1.name;
  const bName = m2.name;

  if (aName.toLowerCase() < bName.toLowerCase()) {
    return -1;
  }
  if (aName.toLowerCase() > bName.toLowerCase()) {
    return 1;
  }
  return 0;
}
export function memberByPowerLevel(m1: RoomMember, m2: RoomMember) {
  const pl1 = m1.powerLevel;
  const pl2 = m2.powerLevel;

  if (pl1 > pl2) return -1;
  if (pl1 < pl2) return 1;
  return 0;
}
