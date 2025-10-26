import * as React from 'react';
import { ComponentProps } from 'react';

export interface TextareaProps extends ComponentProps<'textarea'> {
    className?: string;
}

export declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
