import React from 'react';
import PropTypes from 'prop-types';
import './Dialog.scss';

import { twemojify } from '../../../util/twemojify';

import Text from '../../atoms/text/Text';
import Header, { TitleWrapper } from '../../atoms/header/Header';
import ScrollView from '../../atoms/scroll/ScrollView';
import RawModal from '../../atoms/modal/RawModal';

function Dialog({
  className,
  isOpen,
  title,
  onAfterOpen,
  onAfterClose,
  contentOptions,
  onRequestClose,
  closeFromOutside = true,
  children,
  invisibleScroll = false,
}: {
  className?: string;
  isOpen: boolean;
  title: string | React.ReactNode;
  contentOptions?: React.ReactNode;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  onRequestClose?: () => void;
  closeFromOutside?: boolean;
  children: React.ReactNode;
  invisibleScroll?: boolean;
}) {
  return (
    <RawModal
      className={`${className === null ? '' : `${className} `}dialog-modal`}
      isOpen={isOpen}
      onAfterOpen={onAfterOpen}
      onAfterClose={onAfterClose}
      onRequestClose={onRequestClose}
      closeFromOutside={closeFromOutside}
      size="small"
    >
      <div className="dialog">
        <div className="dialog__content">
          <Header>
            <TitleWrapper>
              {typeof title === 'string' ? (
                <Text variant="h2" weight="medium" primary>
                  {twemojify(title)}
                </Text>
              ) : (
                title
              )}
            </TitleWrapper>
            {contentOptions}
          </Header>
          <div className="dialog__content__wrapper">
            <ScrollView autoHide={!invisibleScroll} invisible={invisibleScroll}>
              <div className="dialog__content-container">{children}</div>
            </ScrollView>
          </div>
        </div>
      </div>
    </RawModal>
  );
}

Dialog.propTypes = {
  className: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.node.isRequired,
  contentOptions: PropTypes.node,
  onAfterOpen: PropTypes.func,
  onAfterClose: PropTypes.func,
  onRequestClose: PropTypes.func,
  closeFromOutside: PropTypes.bool,
  children: PropTypes.node.isRequired,
  invisibleScroll: PropTypes.bool,
};

export default Dialog;
