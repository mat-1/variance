import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ContextMenu.scss';

import Tippy from '@tippyjs/react';
import 'tippy.js/animations/scale-extreme.css';

import Text from '../text/Text';
import Button from '../button/Button';
import ScrollView from '../scroll/ScrollView';

function ContextMenu({
  content,
  placement = 'right',
  maxWidth = 'unset',
  render,
  afterToggle = undefined,
}: {
  content: React.ReactNode | ((hideMenu: () => void) => React.ReactNode);
  placement?: 'top' | 'right' | 'bottom' | 'left';
  maxWidth?: string | number;
  render: (toggleMenu: () => void) => React.ReactNode;
  afterToggle?: (isVisible: boolean) => void;
}) {
  // Initialize with an empty, disconnected element. This is for type-safety.
  const ref = useRef(document.createElement('div'));

  const [isVisible, setVisibility] = useState(false);

  // If this menu is attached to a message, add a class to the message to
  // indicate that the menu is open. This is used to keep the menu visible if
  // the user moves hover away from the message.
  const showMenu = () => {
    if (ref) {
      const parent: Element = ref.current;
      if (parent?.closest) {
        const message = parent.closest('.message');
        if (message) {
          message.classList.add('message--menu-visible');
        }
      }
    }
    return setVisibility(true);
  };

  const hideMenu = () => {
    // If this menu is attached to a message, remove the menu class.
    if (ref) {
      const parent: Element = ref.current;
      if (parent?.closest) {
        const message = parent.closest('.message');
        if (message) {
          message.classList.remove('message--menu-visible');
        }
      }
    }
    return setVisibility(false);
  };

  useEffect(() => {
    if (afterToggle) afterToggle(isVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  return (
    <Tippy
      animation="scale-extreme"
      className="context-menu"
      ref={ref}
      visible={isVisible}
      onClickOutside={hideMenu}
      content={
        <ScrollView invisible>
          {typeof content === 'function' ? content(hideMenu) : content}
        </ScrollView>
      }
      placement={placement}
      interactive
      arrow={false}
      maxWidth={maxWidth}
      duration={200}
    >
      {render(isVisible ? hideMenu : showMenu)}
    </Tippy>
  );
}

ContextMenu.propTypes = {
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  render: PropTypes.func.isRequired,
  afterToggle: PropTypes.func,
};

function MenuHeader({ children }) {
  return (
    <div className="context-menu__header">
      <Text variant="b3">{children}</Text>
    </div>
  );
}

MenuHeader.propTypes = {
  children: PropTypes.node.isRequired,
};

function MenuItem({
  variant = 'surface',
  iconSrc = undefined,
  type = 'button',
  onClick = undefined,
  children,
  disabled = false,
}: {
  variant?: 'surface' | 'positive' | 'caution' | 'danger';
  iconSrc?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="context-menu__item">
      <Button variant={variant} iconSrc={iconSrc} type={type} onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}

MenuItem.propTypes = {
  variant: PropTypes.oneOf(['surface', 'positive', 'caution', 'danger']),
  iconSrc: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

function MenuBorder() {
  return <div style={{ borderBottom: '1px solid var(--bg-surface-border)' }}> </div>;
}

export { ContextMenu as default, MenuHeader, MenuItem, MenuBorder };
