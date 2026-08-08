export const NotifyService = {
    // Basic implementation for now
    success: (msg: string) => {
        console.log(`✅ [Notify] ${msg}`);
        // TODO: Replace with global toast hook
    },
    error: (msg: string) => {
        console.error(`❌ [Notify] ${msg}`);
    },
    info: (msg: string) => {
        console.info(`ℹ️ [Notify] ${msg}`);
    }
};
