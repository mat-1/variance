import EventEmitter from 'events';
import * as sdk from 'matrix-js-sdk';
import Olm from '@matrix-org/olm';
// import { logger } from 'matrix-js-sdk/lib/logger';

import {
  MSC3575List,
  MSC3575_STATE_KEY_ME,
  MSC3575_WILDCARD,
  SlidingSync,
} from 'matrix-js-sdk/lib/sliding-sync';
import { secret } from './state/auth';
import RoomList from './state/RoomList';
import AccountData from './state/AccountData';
import RoomsInput from './state/RoomsInput';
import Notifications from './state/Notifications';
import { cryptoCallbacks } from './state/secretStorageKeys';
import navigation from './state/navigation';

global.Olm = Olm;

// logger.disableAll();

class InitMatrix extends EventEmitter {
  matrixClient: sdk.MatrixClient;

  slidingSync: SlidingSync;

  roomList: RoomList;

  accountData: AccountData;

  roomsInput: RoomsInput;

  notifications: Notifications;

  constructor() {
    super();

    navigation.initMatrix = this;
  }

  async init() {
    await this.startClient();
    this.setupSync();
    this.listenEvents();
  }

  async startClient() {
    const indexedDBStore = new sdk.IndexedDBStore({
      indexedDB: global.indexedDB,
      localStorage: global.localStorage,
      dbName: 'web-sync-store',
    });
    await indexedDBStore.startup();

    this.matrixClient = sdk.createClient({
      baseUrl: secret.baseUrl,
      accessToken: secret.accessToken,
      userId: secret.userId,
      store: indexedDBStore,
      cryptoStore: new sdk.IndexedDBCryptoStore(global.indexedDB, 'crypto-store'),
      deviceId: secret.deviceId,
      timelineSupport: true,
      cryptoCallbacks,
      verificationMethods: ['m.sas.v1'],
    });

    await this.matrixClient.initCrypto();

    this.slidingSync = new SlidingSync(
      secret.slidingSyncProxyUrl,
      new Map(),
      {
        required_state: [
          [MSC3575_WILDCARD, MSC3575_WILDCARD], // all events
        ],
        timeline_limit: 50,
        // missing required_state which will change depending on the kind of room
        include_old_rooms: {
          timeline_limit: 0,
          required_state: [
            // state needed to handle space navigation and tombstone chains
            [sdk.EventType.RoomCreate, ''],
            [sdk.EventType.RoomTombstone, ''],
            [sdk.EventType.SpaceChild, MSC3575_WILDCARD],
            [sdk.EventType.SpaceParent, MSC3575_WILDCARD],
            [sdk.EventType.RoomMember, MSC3575_STATE_KEY_ME],
          ],
        },
      },
      this.matrixClient,
      // timeout
      20 * 1000,
    );
    await this.matrixClient.startClient({
      lazyLoadMembers: true,
      slidingSync: this.slidingSync,
    });
    this.slidingSync.addCustomSubscription('room', {
      timeline_limit: 50,
      required_state: [[MSC3575_WILDCARD, MSC3575_WILDCARD]],
    });
    this.slidingSync.setList('spaces', {
      ranges: [[0, 20]],
      // sort: ['by_name'],
      slow_get_all_rooms: true,
      timeline_limit: 0,
      required_state: [
        [sdk.EventType.RoomJoinRules, ''], // the public icon on the room list
        [sdk.EventType.RoomAvatar, ''], // any room avatar
        [sdk.EventType.RoomTombstone, ''], // lets JS SDK hide rooms which are dead
        [sdk.EventType.RoomEncryption, ''], // lets rooms be configured for E2EE correctly
        [sdk.EventType.RoomCreate, ''], // for isSpaceRoom checks
        [sdk.EventType.SpaceChild, MSC3575_WILDCARD], // all space children
        [sdk.EventType.SpaceParent, MSC3575_WILDCARD], // all space parents
        [sdk.EventType.RoomMember, MSC3575_STATE_KEY_ME], // lets the client calculate that we are in fact in the room
      ],
      sort: ['by_notification_level', 'by_recency'],
      // filters: {
      //   room_types: ['m.space'],
      // },
    });

    this.matrixClient.setGlobalErrorOnUnknownDevices(false);
  }

  setupSync() {
    const sync = {
      NULL: () => {
        console.log('NULL state');
      },
      SYNCING: () => {
        console.log('SYNCING state');
      },
      PREPARED: (prevState) => {
        console.log('PREPARED state');
        console.log('Previous state: ', prevState);
        // TODO: remove global.initMatrix at end
        global.initMatrix = this;
        if (prevState === null) {
          this.roomList = new RoomList(this.matrixClient);
          this.accountData = new AccountData(this.roomList);
          this.roomsInput = new RoomsInput(this.matrixClient, this.roomList);
          this.notifications = new Notifications(this.roomList);
          this.emit('init_loading_finished');
          this.notifications._initNoti();
        } else {
          this.notifications?._initNoti();
        }
      },
      RECONNECTING: () => {
        console.log('RECONNECTING state');
      },
      CATCHUP: () => {
        console.log('CATCHUP state');
      },
      ERROR: () => {
        console.log('ERROR state');
      },
      STOPPED: () => {
        console.log('STOPPED state');
      },
    };
    this.matrixClient.on(sdk.ClientEvent.Sync, (state, prevState) => sync[state](prevState));
  }

  listenEvents() {
    this.matrixClient.on(sdk.HttpApiEvent.SessionLoggedOut, async () => {
      this.matrixClient.stopClient();
      await this.matrixClient.clearStores();
      window.localStorage.clear();
      window.location.reload();
    });
  }

  async logout() {
    this.matrixClient.stopClient();
    try {
      await this.matrixClient.logout();
    } catch {
      // ignore if failed to logout
    }
    await this.matrixClient.clearStores();
    window.localStorage.clear();
    window.location.reload();
  }

  clearCacheAndReload() {
    this.matrixClient.stopClient();
    this.matrixClient.store.deleteAllData().then(() => {
      window.location.reload();
    });
  }

  async setVisibleRoom(roomId: string) {
    console.log('setVisibleRoom', roomId);
    const subscriptions = new Set<string>();
    subscriptions.add(roomId);
    await this.slidingSync.modifyRoomSubscriptions(subscriptions);
  }
}

const initMatrix = new InitMatrix();

export default initMatrix;
