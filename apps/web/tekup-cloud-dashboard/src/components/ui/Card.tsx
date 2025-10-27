import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  shadow?: string;
}

export function Card({
  children,
  className = "",
  hover = false,
  shadow,
}: CardProps) {
  const shadowClass = shadow || "shadow-sm";
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg ${shadowClass} border border-gray-200 dark:border-gray-700 ${
        hover ? "hover:shadow-md transition-shadow duration-200" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}
