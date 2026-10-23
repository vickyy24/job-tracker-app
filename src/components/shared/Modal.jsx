import { useEffect, useRef } from 'react';

export default function Modal({ children, className, role = 'dialog', labelledBy, describedBy, onClose, closeDisabled = false }) {
    const dialogRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const closeDisabledRef = useRef(closeDisabled);

    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    useEffect(() => { closeDisabledRef.current = closeDisabled; }, [closeDisabled]);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const dialog = dialogRef.current;
        const focusable = () => dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
        focusable()[0]?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !closeDisabledRef.current) {
                event.preventDefault();
                onCloseRef.current();
            }
            if (event.key !== 'Tab') return;
            const items = focusable();
            if (!items.length) {
                event.preventDefault();
                dialog.focus();
            } else if (event.shiftKey && document.activeElement === items[0]) {
                event.preventDefault();
                items[items.length - 1].focus();
            } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
                event.preventDefault();
                items[0].focus();
            }
        };

        dialog.addEventListener('keydown', handleKeyDown);
        return () => {
            dialog.removeEventListener('keydown', handleKeyDown);
            if (previousFocus?.isConnected) previousFocus.focus();
            else document.querySelector('[data-dialog-focus-fallback]')?.focus();
        };
    }, []);

    const isApplicationModal = className?.split(/\s+/).includes('application-modal');

    return (
        <div className="modal-backdrop max-[760px]:items-end max-[760px]:p-0" onMouseDown={(event) => { if (event.target === event.currentTarget && !closeDisabled) onCloseRef.current(); }}>
            <section ref={dialogRef} className={`${className} ${isApplicationModal ? 'max-[760px]:w-full max-[760px]:max-w-none max-[760px]:max-h-[min(92dvh,760px)] max-[760px]:rounded-t-2xl max-[760px]:rounded-b-none' : ''}`} role={role} aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} tabIndex="-1">
                {children}
            </section>
        </div>
    );
}
