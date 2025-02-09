import { NotificationCountType, ReceiptType } from 'matrix-js-sdk';
import initMatrix from '../initMatrix';
import settings from '../state/settings';

// eslint-disable-next-line import/prefer-default-export
export async function markAsRead(roomId: string, threadId?: string) {
  const mx = initMatrix.matrixClient;
  const room = mx.getRoom(roomId);
  if (!room) return;

  const thread = threadId ? room.getThread(threadId) : null;

  initMatrix.notifications.deleteNoti(roomId);

  const userId = mx.getUserId();
  if (!userId) {
    console.warn('Tried to markAsRead without a userId');
    return;
  }

  const timeline = room.getLiveTimeline().getEvents();
  const readEventId = room.getEventReadUpTo(userId, true);

  const getLatestValidEvent = () => {
    for (let i = timeline.length - 1; i >= 0; i -= 1) {
      const latestEvent = timeline[i];
      if (latestEvent.getId() === readEventId) return null;
      if (!latestEvent.isSending()) return latestEvent;
    }
    return null;
  };
  if (timeline.length === 0) return;
  const latestEvent = getLatestValidEvent();
  if (latestEvent === null) return;

  const receiptType = settings.sendReadReceipts ? ReceiptType.Read : ReceiptType.ReadPrivate;
  await mx.sendReadReceipt(latestEvent, receiptType);
}
