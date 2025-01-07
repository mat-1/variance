import { useState, useEffect } from 'react';

import { CryptoEvent, type IMyDevice } from 'matrix-js-sdk';
import initMatrix from '../../client/initMatrix';

export function useDeviceList() {
  const mx = initMatrix.matrixClient;
  const [deviceList, setDeviceList] = useState<IMyDevice[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const updateDevices = async () => {
      const data = await mx.getDevices();
      if (!isMounted) return;
      setDeviceList(data.devices || []);
    };
    updateDevices();

    const handleDevicesUpdate = (users: string[]) => {
      if (users.includes(mx.getUserId()!)) {
        updateDevices();
      }
    };

    mx.on(CryptoEvent.DevicesUpdated, handleDevicesUpdate);
    return () => {
      mx.removeListener(CryptoEvent.DevicesUpdated, handleDevicesUpdate);
      isMounted = false;
    };
  }, [mx]);
  return deviceList;
}
