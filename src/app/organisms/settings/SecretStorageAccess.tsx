import React, { FormEvent, useState } from 'react';
import PropTypes from 'prop-types';
import './SecretStorageAccess.scss';
import { decodeRecoveryKey, deriveRecoveryKeyFromPassphrase } from 'matrix-js-sdk/lib/crypto-api';
import { AuthDict, UIAResponse } from 'matrix-js-sdk';

import initMatrix from '../../../client/initMatrix';
import { openReusableDialog } from '../../../client/action/navigation';
import { getDefaultSSKey, getSSKeyInfo } from '../../../util/matrixUtil';
import {
  storePrivateKey,
  hasPrivateKey,
  getPrivateKey,
} from '../../../client/state/secretStorageKeys';

import Text from '../../atoms/text/Text';
import Button from '../../atoms/button/Button';
import Input from '../../atoms/input/Input';
import Spinner from '../../atoms/spinner/Spinner';

import { useStore } from '../../hooks/useStore';
import { authRequest } from './AuthRequest';

interface KeyData {
  keyId: string;
  key?: string;
  phrase?: string;
  privateKey: Uint8Array<ArrayBufferLike>;
}

function SecretStorageAccess({ onComplete }: { onComplete: (_data: KeyData) => void }) {
  const mx = initMatrix.matrixClient;
  const sSKeyId = getDefaultSSKey();
  const sSKeyInfo = getSSKeyInfo(sSKeyId)!;
  const [process, setProcess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountStore = useStore();

  console.log('[secretstorage] sSKeyInfo', sSKeyInfo);

  const processInput = async ({ key, phrase }: KeyInput) => {
    mountStore.setItem(true);
    setProcess(true);
    try {
      if (!sSKeyInfo) {
        console.warn('[secretstorage] no sSKeyInfo');
        return;
      }

      const { salt, iterations } = sSKeyInfo.passphrase || {};
      const privateKey = key
        ? decodeRecoveryKey(key)
        : await deriveRecoveryKeyFromPassphrase(phrase!, salt, iterations);
      const isCorrect = await mx.secretStorage.checkKey(privateKey, sSKeyInfo);

      if (!mountStore.getItem()) return;
      if (!isCorrect) {
        setError(`Incorrect Security ${key ? 'Key' : 'Phrase'}`);
        setProcess(false);
        return;
      }

      onComplete({ keyId: sSKeyId, key, phrase, privateKey });
    } catch (e) {
      console.error("[secretstorage] couldn't validate security key/phrase:", e);
      if (!mountStore.getItem()) return;
      setError(`Incorrect Security ${key ? 'Key' : 'Phrase'}`);
      setProcess(false);
    }
  };

  const handleForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = (e.target as HTMLFormElement).password.value;
    if (password.trim() === '') return;
    const looksLikeKey = password.match(/^([a-zA-Z0-9]{4} ){11}[a-zA-Z0-9]{4}$/);

    const data: KeyInput = {};
    if (looksLikeKey) data.key = password;
    else data.phrase = password;
    processInput(data);
  };

  const handleChange = () => {
    setError(null);
    setProcess(false);
  };

  return (
    <div className="secret-storage-access">
      <form onSubmit={handleForm}>
        <Input
          name="password"
          label="Security Phrase or Key"
          type="password"
          onChange={handleChange}
          required
        />
        {error && <Text variant="b3">{error}</Text>}
        {!process && (
          <div className="secret-storage-access__btn">
            <Button variant="primary" type="submit">
              Continue
            </Button>
          </div>
        )}
      </form>
      {process && <Spinner size="small" />}
    </div>
  );
}
SecretStorageAccess.propTypes = { onComplete: PropTypes.func.isRequired };

interface KeyInput {
  key?: string;
  phrase?: string;
}

/**
 * @param {string} title Title of secret storage access dialog
 * @returns {Promise<keyData | null>} resolve to keyData or null
 */
export const accessSecretStorage = (title: string) =>
  new Promise((resolve) => {
    const mx = initMatrix.matrixClient;

    let isCompleted = false;
    const defaultSSKey = getDefaultSSKey();
    if (hasPrivateKey(defaultSSKey)) {
      resolve({ keyId: defaultSSKey, privateKey: getPrivateKey(defaultSSKey) });
      return;
    }
    const handleComplete = async (keyData: KeyData) => {
      isCompleted = true;
      storePrivateKey(keyData.keyId, keyData.privateKey);

      console.log('[secretstorage] calling bootstrapCrossSigning');
      await mx.getCrypto()!.bootstrapCrossSigning({ authUploadDeviceSigningKeys });

      resolve(keyData);
    };

    const authUploadDeviceSigningKeys = async (
      makeRequest: (_authData: AuthDict | null) => Promise<UIAResponse<void>>,
    ) => {
      console.log('[secretstorage] bootstrapping cross signing');
      const isDone = await authRequest('Setup cross signing', async (auth) => {
        await makeRequest(auth);
      });
      console.log('[secretstorage] isDone:', isDone);
    };

    openReusableDialog(
      <Text variant="s1" weight="medium">
        {title}
      </Text>,
      (requestClose) => (
        <SecretStorageAccess
          onComplete={(keyData) => {
            handleComplete(keyData);
            requestClose();
          }}
        />
      ),
      () => {
        if (!isCompleted) resolve(null);
      },
    );
  });

export default SecretStorageAccess;
