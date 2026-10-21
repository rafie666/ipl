import React from 'react';
import { Badge } from '../ui/Badge';

export default function AppBadge({ status, label, size, icon, style }) {
  return (
    <Badge
      statusKey={status}
      label={label}
      icon={icon}
      style={style}
    />
  );
}
