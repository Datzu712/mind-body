export const logger = new Proxy(console, {
    get(target, prop) {
        if (prop in target) {
            return (...args: unknown[]) => {
                if (__DEV__) {
                    (target[prop as keyof Console] as (...a: unknown[]) => void)(...args);
                }
            };
        }
        return () => {};
    },
}) as Console;
