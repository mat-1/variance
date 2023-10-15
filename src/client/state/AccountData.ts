import EventEmitter from 'events';
import { ClientEvent, MatrixClient } from 'matrix-js-sdk';
import appDispatcher from '../dispatcher';
import cons from './cons';
import RoomList from './RoomList';

class AccountData extends EventEmitter {
  matrixClient: MatrixClient;

  roomList: RoomList;

  spaces: Set<string>;

  spaceShortcut: Set<string>;


  constructor(roomList: RoomList) {
    super();

    this.matrixClient = roomList.matrixClient;
    this.roomList = roomList;
    this.spaces = roomList.spaces;

    this.spaceShortcut = new Set();

    this.spaces.forEach((spaceId) => {
      if(this.roomList.getAllParentSpaces(spaceId).size < 1) {
        this.spaceShortcut.add(spaceId)
      }
    });
  }

  _getAccountData() {
    return this.matrixClient.getAccountData(cons.IN_CINNY_SPACES)?.getContent() || {};
  }


  _updateSpaceShortcutData(shortcutList) {
    const spaceContent = this._getAccountData();
    spaceContent.shortcut = shortcutList;
    this.matrixClient.setAccountData(cons.IN_CINNY_SPACES, spaceContent);
  }

  _listenEvents() {
    this.roomList.on(cons.events.roomList.ROOM_JOINED, (roomId) => {
      if (this.roomList.getAllParentSpaces(roomId).size < 1) {
        // if deleted space has shortcut remove it.
        this.spaceShortcut.add(roomId);
        this._updateSpaceShortcutData([...this.spaceShortcut]);
        this.emit(cons.events.accountData.SPACE_SHORTCUT_UPDATED, roomId);
      }
    });
    this.roomList.on(cons.events.roomList.ROOM_LEAVED, (roomId) => {
      if (this.spaceShortcut.has(roomId)) {
        // if deleted space has shortcut remove it.
        this.spaceShortcut.delete(roomId);
        this._updateSpaceShortcutData([...this.spaceShortcut]);
        this.emit(cons.events.accountData.SPACE_SHORTCUT_UPDATED, roomId);
      }
    });
  }
}

export default AccountData;
