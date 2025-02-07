import React, { FormEvent, useState } from 'react';
import PropTypes from 'prop-types';
import './SecretStorageAccess.scss';
import { deriveKey } from 'matrix-js-sdk/lib/crypto/key_passphrase';

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
import { decodeRecoveryKey } from 'matrix-js-sdk/lib/crypto-api';
import { authRequest } from './AuthRequest';
import { AuthDict, UIAResponse } from 'matrix-js-sdk';

interface KeyData {
  keyId: string;
  key?: string;
  phrase?: string;
  privateKey: Uint8Array<ArrayBufferLike>;
}

function SecretStorageAccess({ onComplete }: { onComplete: (data: KeyData) => void }) {
  const mx = initMatrix.matrixClient;
  const sSKeyId = getDefaultSSKey();
  const sSKeyInfo = getSSKeyInfo(sSKeyId)!;
  const isPassphrase = !!sSKeyInfo.passphrase;
  const [withPhrase, setWithPhrase] = useState(isPassphrase);
  const [process, setProcess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountStore = useStore();

  console.log('[secretstorage] sSKeyInfo', sSKeyInfo);

  const toggleWithPhrase = () => setWithPhrase(!withPhrase);

  const processInput = async ({ key, phrase }: KeyInput) => {
    mountStore.setItem(true);
    setProcess(true);
    try {
      if (!sSKeyInfo) {
        console.warn('[secretstorage] no sSKeyInfo');
        return;
      }

      const { salt, iterations } = sSKeyInfo.passphrase || {};
      const privateKey = key ? decodeRecoveryKey(key) : await deriveKey(phrase!, salt, iterations);
      const isCorrect = await mx.secretStorage.checkKey(privateKey, sSKeyInfo);

      if (!mountStore.getItem()) return;
      if (!isCorrect) {
        setError(`Incorrect Security ${key ? 'Key' : 'Phrase'}`);
        setProcess(false);
        return;
      }

      onComplete({
        keyId: sSKeyId,
        key,
        phrase,
        privateKey,
      });
    } catch (e) {
      console.error("[secretstorage] couldn't validate security key/phrase:", e);
      if (!mountStore.getItem()) return;
      setError(`Incorrect Security ${key ? 'Key' : 'Phrase'}`);
      setProcess(false);
    }
  };

  const handleForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = e.target.password.value;
    if (password.trim() === '') return;
    const data: KeyInput = {};
    if (withPhrase) data.phrase = password;
    else data.key = password;
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
          label={`Security ${withPhrase ? 'Phrase' : 'Key'}`}
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
            {isPassphrase && (
              <Button onClick={toggleWithPhrase}>{`Use Security ${
                withPhrase ? 'Key' : 'Phrase'
              }`}</Button>
            )}
          </div>
        )}
      </form>
      {process && <Spinner size="small" />}
    </div>
  );
}
SecretStorageAccess.propTypes = {
  onComplete: PropTypes.func.isRequired,
};

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
      await mx.getCrypto()!.bootstrapCrossSigning({
        authUploadDeviceSigningKeys,
      });

      resolve(keyData);
    };

    const authUploadDeviceSigningKeys = async (
      makeRequest: (authData: AuthDict | null) => Promise<UIAResponse<void>>,
    ) => {
      console.log('[secretstorage] bootstrapping cross signing with authData:', authData);
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
            requestClose(requestClose);
          }}
        />
      ),
      () => {
        if (!isCompleted) resolve(null);
      },
    );
  });

export default SecretStorageAccess;
