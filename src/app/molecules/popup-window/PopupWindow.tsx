import React from 'react';
import PropTypes from 'prop-types';
import './PopupWindow.scss';

import { twemojify } from '../../../util/twemojify';

import Text from '../../atoms/text/Text';
import IconButton from '../../atoms/button/IconButton';
import { MenuItem } from '../../atoms/context-menu/ContextMenu';
import Header, { TitleWrapper } from '../../atoms/header/Header';
import ScrollView from '../../atoms/scroll/ScrollView';
import RawModal from '../../atoms/modal/RawModal';

import ChevronLeftIC from '../../../../public/res/ic/outlined/chevron-left.svg';

function PWContentSelector({
  selected = false,
  variant = 'surface',
  iconSrc = 'none',
  type = 'button',
  onClick,
  children,
}) {
  const pwcsClass = selected ? ' pw-content-selector--selected' : '';
  return (
    <div className={`pw-content-selector${pwcsClass}`}>
      <MenuItem variant={variant} iconSrc={iconSrc} type={type} onClick={onClick}>
        {children}
      </MenuItem>
    </div>
  );
}

PWContentSelector.propTypes = {
  selected: PropTypes.bool,
  variant: PropTypes.oneOf(['surface', 'caution', 'danger']),
  iconSrc: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit']),
  onClick: PropTypes.func.isRequired,
  children: PropTypes.string.isRequired,
};

// {
//   className: null,
//   drawer: null,
//   contentTitle: null,
//   drawerOptions: null,
//   contentOptions: null,
//   onAfterClose: null,
//   onRequestClose: null,
// }
function PopupWindow({
  className = null,
  isOpen,
  title,
  contentTitle = null,
  drawer = null,
  drawerOptions = null,
  contentOptions = null,
  onAfterClose = null,
  onRequestClose = null,
  children,
  extraLarge,
}) {
  const haveDrawer = drawer !== null;
  const cTitle = contentTitle !== null ? contentTitle : title;

  let size: string;
  if (extraLarge) {
    size = 'extra-large';
  } else if (haveDrawer) {
    size = 'large';
  } else {
    size = 'medium';
  }

  return (
    <RawModal
      className={`${className === null ? '' : `${className} `}pw-modal`}
      overlayClassName="pw-modal__overlay"
      isOpen={isOpen}
      onAfterClose={onAfterClose}
      onRequestClose={onRequestClose}
      size={size}
    >
      <div className="pw">
        {haveDrawer && (
          <div className="pw__drawer">
            <Header>
              <IconButton
                size="small"
                src={ChevronLeftIC}
                onClick={onRequestClose}
                tooltip="Back"
              />
              <TitleWrapper>
                {typeof title === 'string' ? (
                  <Text variant="s1" weight="medium" primary>
                    {twemojify(title)}
                  </Text>
                ) : (
                  title
                )}
              </TitleWrapper>
              {drawerOptions}
            </Header>
            <div className="pw__drawer__content__wrapper">
              <ScrollView invisible>
                <div className="pw__drawer__content">{drawer}</div>
              </ScrollView>
            </div>
          </div>
        )}
        <div className="pw__content">
          <Header>
            <TitleWrapper>
              {typeof cTitle === 'string' ? (
                <Text variant="h2" weight="medium" primary>
                  {twemojify(cTitle)}
                </Text>
              ) : (
                cTitle
              )}
            </TitleWrapper>
            {contentOptions}
          </Header>
          <div className="pw__content__wrapper">
            <ScrollView autoHide>
              <div className="pw__content-container">{children}</div>
            </ScrollView>
          </div>
        </div>
      </div>
    </RawModal>
  );
}

PopupWindow.propTypes = {
  className: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.node.isRequired,
  contentTitle: PropTypes.node,
  drawer: PropTypes.node,
  drawerOptions: PropTypes.node,
  contentOptions: PropTypes.node,
  onAfterClose: PropTypes.func,
  onRequestClose: PropTypes.func,
  children: PropTypes.node.isRequired,
  extraLarge: PropTypes.bool,
};

export default PopupWindow;
export { PWContentSelector };
