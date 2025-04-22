import React, { useState, useEffect } from 'react';
import './DeviceManage.scss';
import dateFormat from 'dateformat';

import { CryptoEvent } from 'matrix-js-sdk/lib/crypto-api';
import { AuthDict, IMyDevice } from 'matrix-js-sdk';
import { OwnDeviceKeys } from 'matrix-js-sdk/lib/crypto-api';

import initMatrix from '../../../client/initMatrix';
import { isCrossVerified } from '../../../util/matrixUtil';
import { openReusableDialog, openEmojiVerification } from '../../../client/action/navigation';

import Text from '../../atoms/text/Text';
import Button from '../../atoms/button/Button';
import IconButton from '../../atoms/button/IconButton';
import Input from '../../atoms/input/Input';
import { MenuHeader } from '../../atoms/context-menu/ContextMenu';
import InfoCard from '../../atoms/card/InfoCard';
import Spinner from '../../atoms/spinner/Spinner';
import SettingTile from '../../molecules/setting-tile/SettingTile';

import PencilIC from '../../../../public/res/ic/outlined/pencil.svg';
import BinIC from '../../../../public/res/ic/outlined/bin.svg';
import InfoIC from '../../../../public/res/ic/outlined/info.svg';

import { authRequest } from './AuthRequest';
import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';

import { useStore } from '../../hooks/useStore';
import { useDeviceList } from '../../hooks/useDeviceList';
import { useCrossSigningStatus } from '../../hooks/useCrossSigningStatus';
import { accessSecretStorage } from './SecretStorageAccess';

const promptDeviceName = async (deviceName: string): Promise<string | null> =>
  new Promise((resolve) => {
    let isCompleted = false;

    const renderContent = (onComplete: (name: string | null) => void) => {
      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const name = (e.target as HTMLFormElement).session.value;
        if (typeof name !== 'string') onComplete(null);
        onComplete(name);
      };
      return (
        <form className="device-manage__rename" onSubmit={handleSubmit}>
          <Input value={deviceName} label="Session name" name="session" />
          <div className="device-manage__rename-btn">
            <Button variant="primary" type="submit">
              Save
            </Button>
            <Button onClick={() => onComplete(null)}>Cancel</Button>
          </div>
        </form>
      );
    };

    openReusableDialog(
      <Text variant="s1" weight="medium">
        Edit session name
      </Text>,
      (requestClose: () => void) =>
        renderContent((name) => {
          isCompleted = true;
          resolve(name);
          requestClose();
        }),
      () => {
        if (!isCompleted) resolve(null);
      },
    );
  });

function DeviceManage() {
  const TRUNCATED_COUNT = 4;
  const mx = initMatrix.matrixClient;
  const isCSEnabled = useCrossSigningStatus();
  const deviceList = useDeviceList();
  const [processing, setProcessing] = useState<string[]>([]);
  const [truncated, setTruncated] = useState(true);
  /** Used to tell whether this component is mounted. */
  const mountStore = useStore<boolean>();
  mountStore.setItem(true);
  // const isMeVerified = await isCrossVerified(mx.deviceId);
  const [isMeVerified, setIsMeVerified] = useState<boolean | null>(false);
  useEffect(() => {
    isCrossVerified(mx.deviceId!).then((verified) => setIsMeVerified(verified));
  }, [mx.deviceId]);

  useEffect(() => {
    setProcessing([]);
  }, [deviceList]);

  const addToProcessing = (device: IMyDevice) => {
    const old = [...processing];
    old.push(device.device_id);
    setProcessing(old);
  };

  const removeFromProcessing = (device: IMyDevice) => {
    const newProcessing = processing.filter((id) => id !== device.device_id);
    setProcessing(newProcessing);
  };

  const [ownDeviceKeys, setOwnDeviceKeys] = useState<OwnDeviceKeys>({
    ed25519: '',
    curve25519: '',
  });
  useEffect(() => {
    mx.getCrypto()!
      .getOwnDeviceKeys()
      .then((keys) => {
        setOwnDeviceKeys(keys);
      });
  }, [mx]);

  const [unverified, setUnverified] = useState<IMyDevice[]>([]);
  const [verified, setVerified] = useState<IMyDevice[]>([]);
  const [noEncryption, setNoEncryption] = useState<IMyDevice[]>([]);

  useEffect(() => {
    const verificationStatusPromises =
      deviceList?.map(async (device) => {
        const isVerified = await isCrossVerified(device.device_id);
        return { device, isVerified };
      }) ?? [];
    Promise.all(verificationStatusPromises).then((results) => {
      const unverifiedDevices: IMyDevice[] = [];
      const verifiedDevices: IMyDevice[] = [];
      const noEncryptionDevices: IMyDevice[] = [];
      results.forEach(({ device, isVerified }) => {
        if (isVerified === true) {
          verifiedDevices.push(device);
        } else if (isVerified === false) {
          unverifiedDevices.push(device);
        } else {
          noEncryptionDevices.push(device);
        }
      });
      setUnverified(unverifiedDevices);
      setVerified(verifiedDevices);
      setNoEncryption(noEncryptionDevices);
    });
  }, [deviceList]);

  if (deviceList === null) {
    return (
      <div className="device-manage">
        <div className="device-manage__loading">
          <Spinner size="small" />
          <Text>Loading devices...</Text>
        </div>
      </div>
    );
  }

  const handleRename = async (device: IMyDevice) => {
    const newName = await promptDeviceName(device.display_name ?? '');
    if (newName === null || newName.trim() === '') return;
    if (newName.trim() === device.display_name) return;
    addToProcessing(device);
    try {
      await mx.setDeviceDetails(device.device_id, { display_name: newName });
    } catch (err) {
      // ignore errors
      console.error("Couldn't rename device:", err);
    }
    // not all homeservers send this event when we update devices, so we need to send it ourselves to make the ui update
    mx.emit(CryptoEvent.DevicesUpdated, [mx.getUserId()!], true);

    if (mountStore.getItem()) {
      removeFromProcessing(device);
    }
  };

  const handleRemove = async (device: IMyDevice) => {
    const isConfirmed = await confirmDialog(
      `Logout ${device.display_name}`,
      `You are about to logout "${device.display_name}" session.`,
      'Logout',
      'danger',
    );
    if (!isConfirmed) return;
    addToProcessing(device);
    await authRequest(`Logout "${device.display_name}"`, async (auth: AuthDict) => {
      await mx.deleteDevice(device.device_id, auth);
    });

    if (!mountStore.getItem()) return;
    removeFromProcessing(device);

    // not all homeservers send this event when we update devices, so we need to send it ourselves to make the ui update
    mx.emit(CryptoEvent.DevicesUpdated, [mx.getUserId()!], true);
  };

  const verifyWithKey = async (device: IMyDevice) => {
    const keyData = await accessSecretStorage('Session verification');
    if (!keyData) return;
    addToProcessing(device);
  };

  const verifyWithEmojis = async (deviceId: string) => {
    const req = await mx.getCrypto()!.requestDeviceVerification(mx.getUserId()!, deviceId);
    console.log('starting to verify device', deviceId, 'with emojis', req);
    openEmojiVerification(req, { userId: mx.getUserId()!, deviceId });
  };

  const verify = (device: IMyDevice, isCurrentDevice: boolean) => {
    if (isCurrentDevice) {
      console.log('trying to verify current device, verifying with key instead of emojis');
      verifyWithKey(device);
      return;
    }
    verifyWithEmojis(device.device_id);
  };

  const renderDevice = (
    device: IMyDevice,
    isVerified: boolean | null,
    deviceKeys: OwnDeviceKeys,
  ) => {
    const deviceId = device.device_id;
    const displayName = device.display_name;
    const lastIP = device.last_seen_ip;
    const lastTS = device.last_seen_ts ?? 0;
    const isCurrentDevice = mx.deviceId === deviceId;
    const canVerify = isVerified === false && (isMeVerified || isCurrentDevice);

    // more than 90 days old
    const isLastTimestampOld = lastTS < Date.now() - 1000 * 60 * 60 * 24 * 90;

    return (
      <SettingTile
        key={deviceId}
        title={
          <Text style={{ color: isVerified !== false ? '' : 'var(--tc-danger-high)' }}>
            {displayName}
            <Text variant="b3" span>{`${displayName ? ' — ' : ''}${deviceId}`}</Text>
            {isCurrentDevice && (
              <Text span className="device-manage__current-label" variant="b3">
                Current
              </Text>
            )}
          </Text>
        }
        options={
          processing.includes(deviceId) ? (
            <Spinner size="small" />
          ) : (
            <>
              {isCSEnabled && canVerify && (
                <Button onClick={() => verify(device, isCurrentDevice)} variant="positive">
                  Verify
                </Button>
              )}
              <IconButton
                size="small"
                onClick={() => handleRename(device)}
                src={PencilIC}
                tooltip="Rename"
              />
              <IconButton
                size="small"
                onClick={() => handleRemove(device)}
                src={BinIC}
                tooltip="Remove session"
              />
            </>
          )
        }
        content={
          <>
            {lastTS && (
              <Text variant="b3">
                Last activity
                <span
                  style={{
                    color: isLastTimestampOld
                      ? 'var(--tc-danger-high)'
                      : 'var(--tc-surface-normal)',
                  }}
                >
                  {dateFormat(new Date(lastTS), ' hh:MM TT, dd/mm/yyyy')}
                  {isLastTimestampOld ? ' (old)' : ''}
                </span>
                {lastIP ? ` at ${lastIP}` : ''}
              </Text>
            )}
            {isCurrentDevice && (
              <Text style={{ marginTop: 'var(--sp-ultra-tight)' }} variant="b3">
                {`Session Key: ${deviceKeys.ed25519.match(/.{1,4}/g)?.join(' ')}`}
              </Text>
            )}
          </>
        }
      />
    );
  };

  return (
    <div className="device-manage">
      <div>
        <MenuHeader>Unverified sessions</MenuHeader>
        {!isCSEnabled && (
          <div style={{ padding: 'var(--sp-extra-tight) var(--sp-normal)' }}>
            <InfoCard
              rounded
              variant="caution"
              iconSrc={InfoIC}
              title="Setup cross signing in case you lose all your sessions."
            />
          </div>
        )}
        {unverified.length > 0 ? (
          unverified.map((device) => renderDevice(device, false, ownDeviceKeys))
        ) : (
          <Text className="device-manage__info">No unverified sessions</Text>
        )}
      </div>
      {noEncryption.length > 0 && (
        <div>
          <MenuHeader>Sessions without encryption support</MenuHeader>
          {noEncryption.map((device) => renderDevice(device, null, ownDeviceKeys))}
        </div>
      )}
      <div>
        <MenuHeader>Verified sessions</MenuHeader>
        {verified.length > 0 ? (
          verified.map((device, index) => {
            if (truncated && index >= TRUNCATED_COUNT) return null;
            return renderDevice(device, true, ownDeviceKeys);
          })
        ) : (
          <Text className="device-manage__info">No verified sessions</Text>
        )}
        {verified.length > TRUNCATED_COUNT && (
          <Button className="device-manage__info" onClick={() => setTruncated(!truncated)}>
            {truncated ? `View ${verified.length - 4} more` : 'View less'}
          </Button>
        )}
        {deviceList.length > 0 && (
          <Text className="device-manage__info" variant="b3">
            Session names are visible to everyone, so do not put any private info here.
          </Text>
        )}
      </div>
    </div>
  );
}

export default DeviceManage;
