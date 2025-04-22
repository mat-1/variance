import EventEmitter from 'events';
import * as sdk from 'matrix-js-sdk';

import { secret } from './state/auth';
import RoomList from './state/RoomList';
import AccountData from './state/AccountData';
import RoomsInput from './state/RoomsInput';
import Notifications from './state/Notifications';
import { cryptoCallbacks } from './state/secretStorageKeys';
import navigation from './state/navigation';

// logger.disableAll();

export class InitMatrix extends EventEmitter {
  // it is possible for these to be undefined in some cases (like while it's loading), but in
  // almost all cases we already know it's defined so we want to avoid having to add a ! every time
  matrixClient!: sdk.MatrixClient;

  roomList!: RoomList;

  accountData!: AccountData;

  roomsInput!: RoomsInput;

  notifications!: Notifications;

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

    if (!secret.baseUrl) {
      throw new Error('baseUrl must be set when calling startClient');
    }

    this.matrixClient = sdk.createClient({
      baseUrl: secret.baseUrl,
      accessToken: secret.accessToken ?? undefined,
      userId: secret.userId ?? undefined,
      store: indexedDBStore,
      cryptoStore: new sdk.IndexedDBCryptoStore(global.indexedDB, 'crypto-store'),
      deviceId: secret.deviceId ?? undefined,
      timelineSupport: true,
      cryptoCallbacks,
      verificationMethods: ['m.sas.v1'],
    });

    // variance doesn't support voip / turn, so disable it to avoid the unnecessary requests
    (this.matrixClient as unknown).canSupportVoip = false;

    await indexedDBStore.startup();
    await this.matrixClient.initRustCrypto();

    await this.matrixClient.startClient({
      lazyLoadMembers: true,
      threadSupport: true,

      // slidingSync: new SlidingSync(),
    });
    const crypto = this.matrixClient.getCrypto();
    if (crypto) crypto.globalBlacklistUnverifiedDevices = false;
  }

  setupSync() {
    const sync = {
      NULL: () => {
        console.log('NULL state');
      },
      SYNCING: () => {
        console.log('SYNCING state');
      },
      PREPARED: (prevState: string | null) => {
        console.log('PREPARED state');
        console.log('Previous state:', prevState);
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
      ERROR: (_prevState: string | null, data?: sdk.SyncStateData) => {
        console.log('ERROR state');
        console.log('Error data:', data?.error);
        if (data?.error instanceof sdk.InvalidCryptoStoreError) {
          (async () => {
            console.log("it's an InvalidCryptoStoreError, deleting cache");
            await this.matrixClient.store.deleteAllData();
            console.log('cache deleted, reloading');
            window.location.reload();
          })();
        }
      },
      STOPPED: () => {
        console.log('STOPPED state');
      },
    };
    this.matrixClient.on(
      sdk.ClientEvent.Sync,
      (state: sdk.SyncState, prevState: sdk.SyncState | null, data?: sdk.SyncStateData) =>
        sync[state](prevState, data),
    );
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
}

const initMatrix = new InitMatrix();

export default initMatrix;
