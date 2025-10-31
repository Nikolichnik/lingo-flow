(function (global) {
    global.LingoFlow = global.LingoFlow || {};

    function start() {
        const ns = global.LingoFlow;
        const createDeckStore = ns.deckStore?.createDeckStore;
        const csv = ns.csv;
        const initializeSpeech = ns.speech?.initializeSpeech;
        const bootstrap = ns.ui?.bootstrap;

        if (typeof createDeckStore !== 'function' || typeof bootstrap !== 'function' || !csv || !initializeSpeech) {
            console.error('LingoFlow: missing dependencies');
            return;
        }

        const deckStore = createDeckStore();
        bootstrap({
            deckStore,
            csv,
            initializeSpeech
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})(window);
