import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import { getRelevantPacks } from './custom-emoji';

interface Emoji {
  shortcode: string;
  src: string | HTMLElement;
  unicode: string;
}

interface ImagePack {
  id: string;
  content: {
    images: object;
  };
  packIndex: number;
  emoticons: Emoji[];
}

const availableEmoji: ImagePack[] = [];

navigation.on(cons.events.navigation.ROOM_SELECTED, (roomId: string) => {
  if (!roomId) {
    availableEmoji.length = 0;
    return;
  }

  const client = initMatrix.matrixClient;
  const room = client.getRoom(roomId);

  if (room) {
    const parentRoomIds: Set<string> = initMatrix.roomList.getAllParentSpaces(room.roomId);
    const parentRooms = Array.from(parentRoomIds).map((id) => client.getRoom(id));

    const packs: ImagePack[] = getRelevantPacks(room.client, [room, ...parentRooms]).filter(
      (pack) => pack.getEmojis().length > 0,
    );

    for (let i = 0; i < packs.length; i += 1) {
      packs[i].packIndex = i;
    }

    availableEmoji.length = 0;
    availableEmoji.push(...packs);
  } else {
    availableEmoji.length = 0;
  }
});

export default availableEmoji;
