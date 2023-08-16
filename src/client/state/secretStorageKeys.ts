const secretStorageKeys = new Map<string, Uint8Array>();

export function storePrivateKey(keyId: string, privateKey: Uint8Array) {
  if (privateKey instanceof Uint8Array === false) {
    throw new Error('Unable to store, privateKey is invalid.');
  }
  secretStorageKeys.set(keyId, privateKey);
}

export function hasPrivateKey(keyId: string) {
  return secretStorageKeys.get(keyId) instanceof Uint8Array;
}

export function getPrivateKey(keyId: string) {
  return secretStorageKeys.get(keyId);
}

export function deletePrivateKey(keyId: string) {
  secretStorageKeys.delete(keyId);
}

export function clearSecretStorageKeys() {
  secretStorageKeys.clear();
}

async function getSecretStorageKey({ keys }): Promise<[string, Uint8Array]> {
  const keyIds = Object.keys(keys);
  const keyId = keyIds.find(hasPrivateKey);
  if (!keyId) return undefined;
  const privateKey = getPrivateKey(keyId);
  return [keyId, privateKey];
}

function cacheSecretStorageKey(keyId: string, keyInfo, privateKey) {
  secretStorageKeys.set(keyId, privateKey);
}

export const cryptoCallbacks = {
  getSecretStorageKey,
  cacheSecretStorageKey,
};
