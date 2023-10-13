import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Tabs.scss';

import Button from '../button/Button';
import ScrollView from '../scroll/ScrollView';

function TabItem({ selected, iconSrc, onClick, children, disabled }) {
  const isSelected = selected ? 'tab-item--selected' : '';

  return (
    <Button
      className={`tab-item ${isSelected}`}
      iconSrc={iconSrc}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

TabItem.defaultProps = {
  selected: false,
  iconSrc: null,
  onClick: null,
  disabled: false,
};

TabItem.propTypes = {
  selected: PropTypes.bool,
  iconSrc: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

function Tabs<D = undefined>({
  items,
  defaultSelected,
  onSelect,
  data,
}: {
  items: { iconSrc: string; text: string; disabled: boolean; render?: (d?: D) => Element }[];
  defaultSelected: number;
  onSelect: (item: { iconSrc: string; text: string; disabled: boolean }, index: number) => void;
  data?: D;
}) {
  const [selectedItem, setSelectedItem] = useState(items[defaultSelected]);

  const handleTabSelection = (item, index) => {
    if (selectedItem === item) return;
    setSelectedItem(item);
    onSelect(item, index);
  };

  return (
    <div className="tabs-container">
      <div className="tabs">
        <ScrollView horizontal={false} vertical invisible>
          <div className="tabs__content">
            {items.map((item, index) => (
              <TabItem
                key={item.text}
                selected={selectedItem.text === item.text}
                iconSrc={item.iconSrc}
                disabled={item.disabled}
                onClick={() => handleTabSelection(item, index)}
              >
                {item.text}
              </TabItem>
            ))}
          </div>
        </ScrollView>
      </div>
      <ScrollView autohide>{selectedItem.render(data)}</ScrollView>
    </div>
  );
}

Tabs.defaultProps = {
  defaultSelected: 0,
};

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      iconSrc: PropTypes.string,
      text: PropTypes.string,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  defaultSelected: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
};

export default Tabs;
