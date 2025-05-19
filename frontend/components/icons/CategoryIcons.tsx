import React from 'react';

// Interface for Emoji Icon props
interface EmojiIconProps {
  emoji: string;
  label: string;
  className?: string;
  size?: number;
}

// Base Emoji Icon component
const EmojiIcon: React.FC<EmojiIconProps> = ({
  emoji,
  label,
  className = '',
  size = 20
}) => (
  <span
    role="img"
    aria-label={label}
    className={`inline-block ${className}`}
    style={{
      fontSize: `${size/16}rem`,
      lineHeight: 1
    }}
  >
    {emoji}
  </span>
);

// Type for icon component props
interface IconProps {
  className?: string;
  size?: number;
}

// Category icons using emojis
export const bakery: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🍞" label="Bread" {...props} />
);

export const beverages: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🥤" label="Drink" {...props} />
);

export const condiments: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🧂" label="Salt" {...props} />
);

export const dairy: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🥛" label="Milk" {...props} />
);

export const meat: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🥩" label="Meat" {...props} />
);

export const pantry: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🥫" label="Toolbox" {...props} />
);

export const produce: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🥬" label="Leafy Green" {...props} />
);

export const seafood: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🐟" label="Fish" {...props} />
);

export const frozen: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="❄️" label="Snowflake" {...props} />
);

export const spices: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🌶️" label="Hot Pepper" {...props} />
);

export const fruits: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🍎" label="Apple" {...props} />
);

export const vegetables: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🥕" label="Carrot" {...props} />
);

export const deli: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🧀" label="Package" {...props} />
);

export const breakfast: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="🍯" label="Package" {...props} />
);

export const other: React.FC<IconProps> = (props) => (
  <EmojiIcon emoji="📦" label="Package" {...props} />
);

// Export a default object with all icons
const CategoryIcons = {
  bakery,
  breakfast,
  beverages,
  condiments,
  dairy,
  deli,
  meat,
  pantry,
  produce,
  seafood,
  frozen,
  spices,
  fruits,
  vegetables,
  other
};

export default CategoryIcons;