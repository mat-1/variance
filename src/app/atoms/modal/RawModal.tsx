import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './RawModal.scss';

import Modal from 'react-modal';

import navigation from '../../../client/state/navigation';

Modal.setAppElement('#root');

function RawModal({
  className,
  overlayClassName,
  isOpen,
  size = 'small',
  onAfterOpen,
  onAfterClose,
  onRequestClose,
  closeFromOutside,
  children,
}: {
  className?: string;
  overlayClassName?: string;
  isOpen: boolean;
  size?: 'extra-large' | 'large' | 'medium' | 'small';
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  onRequestClose?: () => void;
  closeFromOutside?: boolean;
  children: React.ReactNode;
}) {
  let modalClass = className ? `${className} ` : '';
  switch (size) {
    case 'extra-large':
      modalClass += 'raw-modal__extra-large ';
      break;
    case 'large':
      modalClass += 'raw-modal__large ';
      break;
    case 'medium':
      modalClass += 'raw-modal__medium ';
      break;
    case 'small':
    default:
      modalClass += 'raw-modal__small ';
  }

  useEffect(() => {
    navigation.setIsRawModalVisible(isOpen);
  }, [isOpen]);

  const modalOverlayClass = overlayClassName ? `${overlayClassName} ` : '';
  return (
    <Modal
      className={`${modalClass}raw-modal`}
      overlayClassName={`${modalOverlayClass}raw-modal__overlay`}
      isOpen={isOpen}
      onAfterOpen={onAfterOpen}
      onAfterClose={onAfterClose}
      onRequestClose={onRequestClose}
      shouldCloseOnEsc={closeFromOutside}
      shouldCloseOnOverlayClick={closeFromOutside}
      shouldReturnFocusAfterClose={false}
    >
      {children}
    </Modal>
  );
}

RawModal.propTypes = {
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  size: PropTypes.oneOf(['extra-large', 'large', 'medium', 'small']),
  onAfterOpen: PropTypes.func,
  onAfterClose: PropTypes.func,
  onRequestClose: PropTypes.func,
  closeFromOutside: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default RawModal;
