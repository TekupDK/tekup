import * as React from 'react';
import { ReactNode } from 'react';

export interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode;
}

export interface DialogContentProps {
    children?: ReactNode;
    className?: string;
}

export interface DialogHeaderProps {
    children?: ReactNode;
    className?: string;
}

export interface DialogTitleProps {
    children?: ReactNode;
    className?: string;
}

export interface DialogFooterProps {
    children?: ReactNode;
    className?: string;
}

export declare const Dialog: React.FC<DialogProps>;
export declare const DialogContent: React.FC<DialogContentProps>;
export declare const DialogHeader: React.FC<DialogHeaderProps>;
export declare const DialogTitle: React.FC<DialogTitleProps>;
export declare const DialogFooter: React.FC<DialogFooterProps>;
