import * as React from 'react';
import { ComponentProps } from 'react';

export interface InputProps extends ComponentProps<'input'> {
    className?: string;
}

export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
