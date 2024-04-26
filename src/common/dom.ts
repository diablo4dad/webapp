import React from "react";

export function onTouchStart(handler: () => void) {
    return (e: React.TouchEvent) => {
        const touch = e.touches[0] ?? e.changedTouches[0];
        const x1 = touch.pageX;
        const y1 = touch.pageY;

        const onTouchEnd = (evt: Event) => {
            const touchEvent = evt as TouchEvent;
            const touch = touchEvent.touches[0] ?? touchEvent.changedTouches[0];
            const x2 = touch.pageX;
            const y2 = touch.pageY;

            e.target?.removeEventListener('touchend', onTouchEnd);

            if (x1 === x2 && y1 === y2) {
                handler();
            }
        }

        e.target?.addEventListener('touchend', onTouchEnd);
    }
}

export function isScreenSmall(): boolean {
    return window.innerWidth <= 1200;
}
