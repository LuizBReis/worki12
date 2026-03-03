import { useState, useEffect } from 'react';

// Default breakpoints matching standard Tailwind CSS
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
    const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

        const onChange = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < breakpoint);

        return () => mql.removeEventListener("change", onChange);
    }, [breakpoint]);

    return !!isMobile;
}

export function useIsTablet() {
    const [isTablet, setIsTablet] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mqlMobile = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
        const mqlDesktop = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);

        const onChange = () => {
            setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);
        };

        mqlMobile.addEventListener("change", onChange);
        mqlDesktop.addEventListener("change", onChange);

        setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);

        return () => {
            mqlMobile.removeEventListener("change", onChange);
            mqlDesktop.removeEventListener("change", onChange);
        };
    }, []);

    return !!isTablet;
}

export function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`);

        const onChange = () => {
            setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT);
        };

        mql.addEventListener("change", onChange);
        setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT);

        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isDesktop;
}

export function useDevice() {
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    const isDesktop = useIsDesktop();

    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'desktop'; // Default fallback
}
