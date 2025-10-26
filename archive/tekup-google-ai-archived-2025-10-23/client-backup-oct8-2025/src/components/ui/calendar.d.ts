/**
 * Type declarations for calendar.jsx component
 * Provides TypeScript types for the shadcn/ui Calendar component
 */

import * as React from "react";
import { DayPickerProps } from "react-day-picker";

export interface CalendarProps extends DayPickerProps {
  className?: string;
  classNames?: Record<string, string>;
}

export function Calendar(props: CalendarProps): React.ReactElement;
