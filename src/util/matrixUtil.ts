import initMatrix from '../client/initMatrix';

import HashIC from '../../public/res/ic/outlined/hash.svg';
import HashGlobeIC from '../../public/res/ic/outlined/hash-globe.svg';
import HashLockIC from '../../public/res/ic/outlined/hash-lock.svg';
import SpaceIC from '../../public/res/ic/outlined/space.svg';
import SpaceGlobeIC from '../../public/res/ic/outlined/space-globe.svg';
import SpaceLockIC from '../../public/res/ic/outlined/space-lock.svg';
import { type RoomMember } from 'matrix-js-sdk';
import { type SecretStorageKeyDescriptionAesV1 } from 'matrix-js-sdk/lib/secret-storage';

const WELL_KNOWN_URI = '/.well-known/matrix/client';

export interface WellKnown {
  'm.homeserver': {
    base_url: string;
  };
  'org.matrix.msc3575.proxy'?: {
    url: string;
  };
}

export async function getWellKnown(servername: string): Promise<WellKnown> {
  let protocol = 'https://';
  if (servername.match(/^https?:\/\//) !== null) protocol = '';
  const serverDiscoveryUrl = `${protocol}${servername}${WELL_KNOWN_URI}`;
  try {
    const result: WellKnown = await fetch(serverDiscoveryUrl, { method: 'GET' }).then((res) =>
      res.json(),
    );

    const baseUrl = result['m.homeserver'].base_url;
    if (baseUrl === undefined) throw new Error();
    return result;
  } catch (e) {
    return {
      'm.homeserver': {
        base_url: `${protocol}${servername}`,
      },
    };
  }
}

export function getUsername(userId: string): string {
  const mx = initMatrix.matrixClient;
  if (!mx) return '';
  const user = mx.getUser(userId);
  if (user === null) return userId;
  let username = user.displayName;
  if (typeof username === 'undefined') {
    username = userId;
  }
  return username;
}

export function getUsernameOfRoomMember(roomMember: RoomMember) {
  return roomMember.name || roomMember.userId;
}

export async function isRoomAliasAvailable(alias: string): Promise<boolean> {
  try {
    const result = await initMatrix.matrixClient.getRoomIdForAlias(alias);
    if (result.room_id) return false;
    return false;
  } catch (e) {
    if (e.errcode === 'M_NOT_FOUND') return true;
    return false;
  }
}

export function getPowerLabel(powerLevel) {
  if (powerLevel > 9000) return 'Goku';
  if (powerLevel > 100) return 'Founder';
  if (powerLevel === 100) return 'Admin';
  if (powerLevel >= 50) return 'Mod';
  return null;
}

export function parseReply(rawBody) {
  if (rawBody?.indexOf('>') !== 0) return null;
  let body = rawBody.slice(rawBody.indexOf('<') + 1);
  const user = body.slice(0, body.indexOf('>'));

  body = body.slice(body.indexOf('>') + 2);
  const replyBody = body.slice(0, body.indexOf('\n\n'));
  body = body.slice(body.indexOf('\n\n') + 2);

  if (user === '') return null;

  const isUserId = user.match(/^@.+:.+/);

  return {
    userId: isUserId ? user : null,
    displayName: isUserId ? null : user,
    replyBody,
    body,
  };
}

export function trimHTMLReply(html) {
  if (!html) return html;
  const suffix = '</mx-reply>';
  const i = html.indexOf(suffix);
  if (i < 0) {
    return html;
  }
  return html.slice(i + suffix.length);
}

export function hasDMWith(userId) {
  const mx = initMatrix.matrixClient;
  const directIds = [...initMatrix.roomList.directs];

  return directIds.find((roomId) => {
    const dRoom = mx.getRoom(roomId);
    const roomMembers = dRoom.getMembers();
    if (roomMembers.length <= 2 && dRoom.getMember(userId)) {
      return true;
    }
    return false;
  });
}

export function joinRuleToIconSrc(joinRule, isSpace) {
  return (
    {
      restricted: () => (isSpace ? SpaceIC : HashIC),
      knock: () => (isSpace ? SpaceLockIC : HashLockIC),
      invite: () => (isSpace ? SpaceLockIC : HashLockIC),
      public: () => (isSpace ? SpaceGlobeIC : HashGlobeIC),
    }[joinRule]?.() || null
  );
}

// NOTE: it gives userId with minimum power level 50;
function getHighestPowerUserId(room) {
  const userIdToPower = room.currentState
    .getStateEvents('m.room.power_levels', '')
    ?.getContent().users;
  let powerUserId = null;
  if (!userIdToPower) return powerUserId;

  Object.keys(userIdToPower).forEach((userId) => {
    if (userIdToPower[userId] < 50) return;
    if (powerUserId === null) {
      powerUserId = userId;
      return;
    }
    if (userIdToPower[userId] > userIdToPower[powerUserId]) {
      powerUserId = userId;
    }
  });
  return powerUserId;
}

export function getIdServer(userId) {
  const idParts = userId.split(':');
  return idParts[1];
}

export function getServerToPopulation(room) {
  const members = room.getMembers();
  const serverToPop = {};

  members?.forEach((member) => {
    const { userId } = member;
    const server = getIdServer(userId);
    const serverPop = serverToPop[server];
    if (serverPop === undefined) {
      serverToPop[server] = 1;
      return;
    }
    serverToPop[server] = serverPop + 1;
  });

  return serverToPop;
}

export function genRoomVia(room) {
  const via = [];
  const userId = getHighestPowerUserId(room);
  if (userId) {
    const server = getIdServer(userId);
    if (server) via.push(server);
  }
  const serverToPop = getServerToPopulation(room);
  const sortedServers = Object.keys(serverToPop).sort(
    (svrA, svrB) => serverToPop[svrB] - serverToPop[svrA],
  );
  const mostPop3 = sortedServers.slice(0, 3);
  if (via.length === 0) return mostPop3;
  if (mostPop3.includes(via[0])) {
    mostPop3.splice(mostPop3.indexOf(via[0]), 1);
  }
  return via.concat(mostPop3.slice(0, 2));
}

export async function isCrossVerified(deviceId: string): Promise<boolean | null> {
  try {
    const mx = initMatrix.matrixClient;
    const deviceTrust = await mx
      .getCrypto()
      ?.getDeviceVerificationStatus(mx.getUserId()!, deviceId);
    if (!deviceTrust) return null;
    return deviceTrust.crossSigningVerified || deviceTrust.signedByOwner;
  } catch {
    // device does not support encryption
    return null;
  }
}

export function hasCrossSigningAccountData() {
  const mx = initMatrix.matrixClient;
  const masterKeyData = mx.getAccountData('m.cross_signing.master');
  return !!masterKeyData;
}

export function getDefaultSSKey() {
  const mx = initMatrix.matrixClient;
  return mx.getAccountData('m.secret_storage.default_key')?.getContent()?.key;
}

export function getSSKeyInfo(key: string): SecretStorageKeyDescriptionAesV1 {
  const mx = initMatrix.matrixClient;
  const content = mx.getAccountData(`m.secret_storage.key.${key}`)?.getContent();
  return content as SecretStorageKeyDescriptionAesV1;
}

export async function hasDevices(userId: string) {
  const mx = initMatrix.matrixClient;
  try {
    // const usersDeviceMap = await mx.downloadKeys([userId, mx.getUserId()]);
    const usersDeviceMap = await mx.getCrypto()?.getUserDeviceInfo([userId, mx.getUserId()!]);
    return Object.values(usersDeviceMap!).every(
      (userDevices) => Object.keys(userDevices).length > 0,
    );
  } catch (e) {
    console.error("Error determining if it's possible to encrypt to all users: ", e);
    return false;
  }
}
