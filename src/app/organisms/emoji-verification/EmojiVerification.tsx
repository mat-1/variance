import React, { useState, useEffect } from 'react';
import './EmojiVerification.scss';
import {
  CrossSigningKey,
  CryptoEvent,
  ShowSasCallbacks,
  VerificationPhase,
  VerificationRequest,
  VerificationRequestEvent,
  VerifierEvent,
} from 'matrix-js-sdk/lib/crypto-api';
import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import { hasPrivateKey } from '../../../client/state/secretStorageKeys';
import { getDefaultSSKey, isCrossVerified } from '../../../util/matrixUtil';

import Text from '../../atoms/text/Text';
import IconButton from '../../atoms/button/IconButton';
import Button from '../../atoms/button/Button';
import Spinner from '../../atoms/spinner/Spinner';
import Dialog from '../../molecules/dialog/Dialog';

import CrossIC from '../../../../public/res/ic/outlined/cross.svg';
import { useStore } from '../../hooks/useStore';
import { accessSecretStorage } from '../settings/SecretStorageAccess';

function EmojiVerificationContent({
  request,
  requestClose,
}: {
  request: VerificationRequest;
  requestClose: () => void;
}) {
  // see https://matrix.org/docs/older/e2ee-cross-signing/

  // sas = Short Authentication Strings = emoji verification
  const [sas, setSas] = useState<ShowSasCallbacks | null>(null);
  /** Whether we're currently waiting for the other side to do something. */
  const [process, setProcess] = useState(false);
  const mx = initMatrix.matrixClient;
  const crypto = mx.getCrypto()!;

  /** Whether this component is currently being shown. */
  const mountStore = useStore<boolean>();
  /** Whether we've gotten at least one message back from the other side. */
  const beginStore = useStore<boolean>();

  const onRequestChange = async () => {
    if (request.phase === VerificationPhase.Done || request.phase === VerificationPhase.Cancelled) {
      console.log('request is done or canceled');
      return;
    }

    if (request.phase === VerificationPhase.Requested) {
      const isMyDeviceVerified = await isCrossVerified(mx.deviceId!);
      const crossSigningKeyId = await crypto.getCrossSigningKeyId(CrossSigningKey.SelfSigning);

      console.log('crossSigningKeyId', crossSigningKeyId);

      if (isMyDeviceVerified && crossSigningKeyId === null) {
        if (!hasPrivateKey(getDefaultSSKey())) {
          console.log('private key not in storage', getDefaultSSKey());
          // this is going to prompt the user to enter their security key
          const keyData = await accessSecretStorage('Emoji verification');
          if (!keyData) {
            console.log('no key data, canceling request :(');
            request.cancel();
            return;
          }
        }
      }

      console.log('accepting request');
      await request.accept();
      console.log('accepted request');

      return;
    }

    if (!beginStore.getItem()) {
      beginStore.setItem(true);
      console.log('called startVerification');
      const verifier = await request.startVerification('m.sas.v1');
      console.log('made verifier', verifier);

      const handleVerifier = (sasData: ShowSasCallbacks) => {
        console.log('in handleVerifier', sasData);
        verifier.off(VerifierEvent.ShowSas, handleVerifier);
        if (!mountStore.getItem()) return;
        setSas(sasData);
        setProcess(false);
      };
      verifier.on(VerifierEvent.ShowSas, handleVerifier);
      // if (request.phase === VerificationPhase.Ready) {
      //   // sleep for a second
      //   console.log('sleeping for 10 seconds');
      //   await new Promise((resolve) => setTimeout(resolve, 10000));
      //   console.log('calling verifier.verify');
      //   await verifier.verify();
      //   console.log('did verifier.verify');
      // }
    }
  };

  const sasMismatch = () => {
    sas?.mismatch();
    setProcess(true);
  };

  const sasConfirm = () => {
    sas?.confirm();
    setProcess(true);
  };

  useEffect(() => {
    mountStore.setItem(true);

    if (request === null) return undefined;

    request.on(VerificationRequestEvent.Change, onRequestChange);
    const req = request;
    return () => {
      // TODO: try seeing if `req` is actually necessary
      req.off(VerificationRequestEvent.Change, onRequestChange);
      if (req.phase !== VerificationPhase.Done && req.phase !== VerificationPhase.Cancelled) {
        console.log('cleanup called, canceling verification');
        req.cancel();
      }
    };
  }, []);

  if (!sas) {
    // very beginning of the verification, waiting for the other side to accept
    if (request.initiatedByMe) {
      return (
        <div className="emoji-verification__content">
          <Text>Please accept the request from other device.</Text>
          <div className="emoji-verification__buttons">
            <Wait request={request} />
          </div>
        </div>
      );
    } else {
      return (
        <div className="emoji-verification__content">
          <Text>Click accept to start the verification process.</Text>
          <div className="emoji-verification__buttons">
            {process ? (
              <Wait request={request} />
            ) : (
              <Button variant="primary" onClick={onRequestChange}>
                Accept
              </Button>
            )}
          </div>
        </div>
      );
    }
  }
  // we finally got emojis to show, this should be happening on both sides at the same time
  return (
    <div className="emoji-verification__content">
      <Text>Confirm the emoji below are displayed on both devices, in the same order:</Text>
      <div className="emoji-verification__emojis">
        {sas.sas.emoji?.map(([emoji, emojiName], i) => (
          <div className="emoji-verification__emoji-block" key={`${emojiName}-${i}`}>
            <Text variant="h1">{twemojify(emoji)}</Text>
            <Text>{emojiName}</Text>
          </div>
        ))}
      </div>
      <div className="emoji-verification__buttons">
        {process ? (
          <Wait request={request} />
        ) : (
          <>
            <Button variant="primary" onClick={sasConfirm}>
              They match
            </Button>
            <Button onClick={sasMismatch}>They don&apos;t match</Button>
          </>
        )}
      </div>
    </div>
  );
}

function useVisibilityToggle(): [VerificationRequest | null, () => void] {
  const [data, setData] = useState<VerificationRequest | null>(null);
  const mx = initMatrix.matrixClient;

  useEffect(() => {
    const handleOpen = (req: VerificationRequest) => {
      console.log('got verification request', req);
      setData(req);
    };

    // this happens when we click "Verify" on an unverified session in security settings
    navigation.on(cons.events.navigation.EMOJI_VERIFICATION_OPENED, handleOpen);
    // this one should trigger for the other device that's going to be verified
    mx.on(CryptoEvent.VerificationRequestReceived, handleOpen);

    return () => {
      navigation.removeListener(cons.events.navigation.EMOJI_VERIFICATION_OPENED, handleOpen);
      mx.removeListener(CryptoEvent.VerificationRequestReceived, handleOpen);
    };
  }, [mx]);

  const requestClose = () => setData(null);

  return [data, requestClose];
}

function EmojiVerification() {
  const [request, requestClose] = useVisibilityToggle();

  return (
    <Dialog
      isOpen={!!request}
      className="emoji-verification"
      title={
        <Text variant="s1" weight="medium" primary>
          Emoji verification
        </Text>
      }
      contentOptions={<IconButton src={CrossIC} onClick={requestClose} tooltip="Close" />}
      onRequestClose={requestClose}
    >
      {request ? (
        <EmojiVerificationContent request={request} requestClose={requestClose} />
      ) : (
        <div />
      )}
    </Dialog>
  );
}

const Wait = ({ request }: { request: VerificationRequest }) => {
  const MESSAGES = {
    [VerificationPhase.Unsent]: 'Nothing has been sent yet...',
    [VerificationPhase.Requested]: 'A verification request has been sent or received...',
    [VerificationPhase.Ready]: 'Verification has been accepted...',
    [VerificationPhase.Started]: 'Verification is in flight...',
    [VerificationPhase.Cancelled]: 'Verification has been canceled.',
    [VerificationPhase.Done]: 'Verification is done.',
  };
  const message = MESSAGES[request.phase] || `Unknown phase: ${request.phase}`;

  return (
    <>
      <Spinner size="small" />
      <Text>{message}</Text>
    </>
  );
};

export default EmojiVerification;
