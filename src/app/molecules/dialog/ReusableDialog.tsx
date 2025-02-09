import React, { useState, useEffect } from 'react';

import cons from '../../../client/state/cons';

import navigation from '../../../client/state/navigation';
import IconButton from '../../atoms/button/IconButton';
import Dialog from './Dialog';

import CrossIC from '../../../../public/res/ic/outlined/cross.svg';

interface DialogueData {
  title: React.ReactNode;
  render: (_close: () => void) => React.ReactNode;
  afterClose?: () => void;
}

function ReusableDialog() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [data, setData] = useState<DialogueData | null>(null);

  useEffect(() => {
    const handleOpen = (
      title: React.ReactNode,
      render: (_close: () => void) => React.ReactNode,
      afterClose?: () => void,
    ) => {
      setIsOpen(true);
      setData({ title, render, afterClose });
    };
    navigation.on(cons.events.navigation.REUSABLE_DIALOG_OPENED, handleOpen);
    return () => {
      navigation.removeListener(cons.events.navigation.REUSABLE_DIALOG_OPENED, handleOpen);
    };
  }, []);

  const handleAfterClose = () => {
    data!.afterClose?.();
    setData(null);
  };

  const handleRequestClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      title={data?.title || ''}
      onAfterClose={handleAfterClose}
      onRequestClose={handleRequestClose}
      contentOptions={<IconButton src={CrossIC} onClick={handleRequestClose} tooltip="Close" />}
      invisibleScroll
    >
      {data?.render(handleRequestClose) || <div />}
    </Dialog>
  );
}

export default ReusableDialog;
