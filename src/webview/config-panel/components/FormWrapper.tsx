import React from "react";

export interface FormWrapperProps {
    dirty: boolean;
    children: React.ReactNode;
}

/**
 * Simple wrapper that exposes a static helper to prompt when navigation would
 * discard unsaved changes.  The wrapper itself currently does not render
 * additional UI, but is a logical placeholder for future cross-cutting
 * behaviour such as auto-save.
 */
export const FormWrapper: React.FC<FormWrapperProps> = ({ dirty, children }) => {
    return <div>{children}</div>;
};

/**
 * Ask the user whether it's safe to switch away from the current form.
 * Returns true if navigation may proceed.
 */
export function confirmDiscard(dirty: boolean): boolean {
    if (dirty) {
        return window.confirm("You have unsaved changes. Switching will discard them. Continue?");
    }
    return true;
}
