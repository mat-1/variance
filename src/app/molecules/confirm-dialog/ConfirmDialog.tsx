import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './ConfirmDialog.scss';

import { openReusableDialog } from '../../../client/action/navigation';

import Text from '../../atoms/text/Text';
import Button from '../../atoms/button/Button';

function ConfirmDialog({
  desc,
  actionTitle,
  actionType,
  onComplete,
}: {
  desc: string;
  actionTitle: string;
  actionType: 'primary' | 'positive' | 'danger' | 'caution';
  onComplete: (isConfirmed: boolean) => void;
}) {
  // on enter pressed
  const acceptingInputs = useRef(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!acceptingInputs.current) {
        return;
      }
      if (e.key === 'Enter') onComplete(true);
    };
    document.addEventListener('keydown', handleKeyDown);

    // this is just so the event doesn't happen immediately (like if we pressed enter to open the dialog)
    const timeout = setTimeout(() => {
      acceptingInputs.current = true;
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="confirm-dialog">
      <Text>{desc}</Text>
      <div className="confirm-dialog__btn">
        <Button variant={actionType} onClick={() => onComplete(true)}>
          {actionTitle}
        </Button>
        <Button onClick={() => onComplete(false)}>Cancel</Button>
      </div>
    </div>
  );
}
ConfirmDialog.propTypes = {
  desc: PropTypes.string.isRequired,
  actionTitle: PropTypes.string.isRequired,
  actionType: PropTypes.oneOf(['primary', 'positive', 'danger', 'caution']).isRequired,
  onComplete: PropTypes.func.isRequired,
};

/**
 * @param {string} title title of confirm dialog
 * @param {string} desc description of confirm dialog
 * @param {string} actionTitle title of main action to take
 * @param {'primary' | 'positive' | 'danger' | 'caution'} actionType type of action. default=primary
 * @return {Promise<boolean>} does it get's confirmed or not
 */
// eslint-disable-next-line import/prefer-default-export
export const confirmDialog = async (
  title: string,
  desc: string,
  actionTitle: string,
  actionType: string = 'primary',
  event: MouseEvent | undefined = undefined,
) => {
  // if shift is held, always skip confirmation dialogues
  if (event?.shiftKey) return true;

  let isCompleted = false;
  const confirmed = await new Promise((resolve) => {
    openReusableDialog(
      <Text variant="s1" weight="medium">
        {title}
      </Text>,
      (requestClose: () => void) => (
        <ConfirmDialog
          desc={desc}
          actionTitle={actionTitle}
          actionType={actionType}
          onComplete={(isConfirmed) => {
            isCompleted = true;
            resolve(isConfirmed);
            requestClose();
          }}
        />
      ),
      () => {
        if (!isCompleted) resolve(false);
      },
    );
  });
  return confirmed;
};
