
import { initCommon } from './ui/common.js';
import { initCarbon } from './ui/carbon.js';
import { initTemper } from './ui/temper.js';
import { initBrit885 } from './ui/brit885.js';
import { initSigma } from './ui/sigma.js';
import { initGoverning } from './ui/governing.js';

const initializeModules = () => {
    console.log("[Brittle Fracture] Initializing modules...");
    try {
        initCommon();
        initCarbon();
        initTemper();
        initBrit885();
        initSigma();
        initGoverning();
        console.log("[Brittle Fracture] Initialization complete.");
    } catch (error) {
        console.error("[Brittle Fracture] Initialization Error:", error);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModules);
} else {
    initializeModules();
}
