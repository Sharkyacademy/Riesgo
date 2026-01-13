document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const btnContinue = document.getElementById('btn_continue_dm');
    
    // Checkboxes
    const checkThinning = document.getElementById('dm_thinning');
    const checkSCC = document.getElementById('dm_scc');
    const checkHTHA = document.getElementById('dm_htha');
    const checkBrittle = document.getElementById('dm_brittle');
    const checkExternal = document.getElementById('dm_external');
    
    // Containers
    const selectionContainer = document.getElementById('damage_mechanism_selection');
    const moduleNavContainer = document.getElementById('module_nav_container');
    const moduleNavList = document.getElementById('module_nav_list');
    
    // Helper function to get module element with error checking
    function getModuleElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`[Module Navigator] Module element with ID "${id}" not found in DOM`);
        }
        return el;
    }
    
    // Module ID Mapping (lazy initialization to ensure DOM is ready)
    function getModules() {
        return {
            'thinning': getModuleElement('thinning_df_top_container'),
            'scc': getModuleElement('scc_module_top_container'),
            'external': getModuleElement('external_damage_module'),
            'htha': getModuleElement('htha_module'),
            'brittle': getModuleElement('brittle_fracture_module')
        };
    }
    
    let MODULES = getModules();

    // State
    let activeModuleIds = [];
    const STORAGE_KEY = 'active_damage_mechanisms';

    // --- Initial Load ---
    restoreState();

    // --- Event Listeners ---

    if(btnContinue) {
        btnContinue.addEventListener('click', () => {
            initializeNavigation(true); // true = save state
        });
    }

    // --- Functions ---

    function initializeNavigation(shouldSave = false) {
        
        // --- Validation: Check if Table 4.1 (Basic Data) is filled ---
        const t41Data = sessionStorage.getItem('table4.1_data');
        const errorEl = document.getElementById('dm_selection_error');

        // Helper to show error
        const showError = (msg) => {
            if(errorEl) {
                errorEl.innerText = msg;
                errorEl.classList.remove('hidden');
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    errorEl.classList.add('hidden');
                }, 3000);
            }
        };

        if (!t41Data) {
            showError("Please complete and save the Component Basic Data (Table 4.1) above before proceeding.");
            
            // Highlight the table or scroll to it?
            const tableContainer = document.getElementById('component_basic_data_container');
            if(tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                tableContainer.classList.add('ring', 'ring-red-500', 'ring-opacity-50');
                setTimeout(() => tableContainer.classList.remove('ring', 'ring-red-500', 'ring-opacity-50'), 2000);
            }
            return;
        }

        activeModuleIds = [];

        // Collect checked items
        if(checkThinning && checkThinning.checked) activeModuleIds.push('thinning');
        if(checkSCC && checkSCC.checked) activeModuleIds.push('scc');
        if(checkBrittle && checkBrittle.checked) activeModuleIds.push('brittle');
        if(checkHTHA && checkHTHA.checked) activeModuleIds.push('htha');
        if(checkExternal && checkExternal.checked) activeModuleIds.push('external');
        
        if(activeModuleIds.length === 0) {
            showError("Please select at least one active damage mechanism.");
            return;
        }

        // Hide error if valid
        if(errorEl) errorEl.classList.add('hidden');

        // Hide Selection Screen
        selectionContainer.classList.add('hidden');

        // Build Tabs (including Back Button)
        buildTabs();

        // Show Nav Container
        moduleNavContainer.classList.remove('hidden');

        // Activate First Module (defaults to first in list)
        activateModule(activeModuleIds[0]);

        if(shouldSave) {
            saveState(activeModuleIds);
        }
    }

    function buildTabs() {
        moduleNavList.innerHTML = ''; // Clear existing

        // 1. "Back/Config" Button (First Item)
        const liBack = document.createElement('li');
        const btnBack = document.createElement('a');
        btnBack.className = "tab text-gray-500 font-bold hover:text-blue-600";
        btnBack.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Config
        `;
        btnBack.title = "Go back to selection";
        btnBack.addEventListener('click', resetSelection);
        liBack.appendChild(btnBack);
        moduleNavList.appendChild(liBack);

        // 2. Module Tabs
        activeModuleIds.forEach(id => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            // Stylize Tab
            a.className = "tab tab-lifted text-lg font-semibold"; 
            a.textContent = getModuleName(id);
            a.dataset.moduleId = id;

            a.addEventListener('click', () => {
                activateModule(id);
            });

            li.appendChild(a);
            moduleNavList.appendChild(li);
        });
    }

    // Helper function to get module ID from targetId
    function getModuleId(id) {
        const idMap = {
            'thinning': 'thinning_df_top_container',
            'scc': 'scc_module_top_container',
            'external': 'external_damage_module',
            'htha': 'htha_module',
            'brittle': 'brittle_fracture_module'
        };
        return idMap[id] || id;
    }

    function activateModule(targetId) {
        // Refresh modules mapping in case DOM changed
        MODULES = getModules();
        
        // Debug: Log all modules found
        console.log(`[Module Navigator] Activating module: ${targetId}`);
        console.log(`[Module Navigator] Available modules:`, Object.keys(MODULES));
        console.log(`[Module Navigator] Module elements:`, MODULES);
        
        // 1. Hide all modules
        Object.values(MODULES).forEach(el => {
            if(el) {
                el.classList.add('hidden');
                // Clear inline styles that might override the hidden class
                el.style.removeProperty('display');
                el.style.removeProperty('visibility');
                el.style.removeProperty('opacity');
                el.style.removeProperty('height');
                el.style.removeProperty('width');
                console.log(`[Module Navigator] Hid module with ID: ${el.id}`);
            }
        });

        // 2. Show target module
        let targetEl = MODULES[targetId];
        
        // Try direct lookup if not found in MODULES
        if(!targetEl) {
            console.warn(`[Module Navigator] Module "${targetId}" not in MODULES object, trying direct lookup...`);
            const moduleId = getModuleId(targetId);
            const directEl = document.getElementById(moduleId);
            if(directEl) {
                console.log(`[Module Navigator] Found element via direct lookup:`, directEl);
                directEl.classList.remove('hidden');
                console.log(`[Module Navigator] Successfully activated module via direct lookup: ${targetId}`);
                // Update MODULES for future use
                MODULES[targetId] = directEl;
            } else {
                console.error(`[Module Navigator] Cannot activate module "${targetId}": element not found in DOM`);
                console.error(`[Module Navigator] Searched for ID: ${moduleId}`);
                // Try querySelector as last resort
                const altEl = document.querySelector(`#${moduleId}`);
                if(altEl) {
                    console.log(`[Module Navigator] Found via querySelector:`, altEl);
                    altEl.classList.remove('hidden');
                    MODULES[targetId] = altEl;
                }
            }
        } else {
            // Remove hidden class
            targetEl.classList.remove('hidden');
            
            // Force visibility with inline styles (more aggressive approach)
            targetEl.style.display = '';
            targetEl.style.visibility = '';
            targetEl.style.opacity = '';
            targetEl.style.height = '';
            targetEl.style.width = '';
            
            // Remove any inline styles that might be hiding it
            if(targetEl.style.display === 'none') {
                targetEl.style.removeProperty('display');
            }
            if(targetEl.style.visibility === 'hidden') {
                targetEl.style.removeProperty('visibility');
            }
            if(targetEl.style.opacity === '0') {
                targetEl.style.removeProperty('opacity');
            }
            
            console.log(`[Module Navigator] Successfully activated module: ${targetId}`, targetEl);
            
            // Verify it's actually visible
            if(targetEl.classList.contains('hidden')) {
                console.warn(`[Module Navigator] WARNING: Module ${targetId} still has 'hidden' class after removal attempt!`);
            }
            
            // Additional debugging: Check computed styles
            const computedStyle = window.getComputedStyle(targetEl);
            console.log(`[Module Navigator] Computed styles for ${targetId}:`, {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                height: computedStyle.height,
                width: computedStyle.width,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                overflow: computedStyle.overflow
            });
            
            // Check if element has content
            console.log(`[Module Navigator] Element innerHTML length: ${targetEl.innerHTML.length}`);
            console.log(`[Module Navigator] Element children count: ${targetEl.children.length}`);
            
            // Force display if needed (after checking computed styles)
            if(computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
                console.warn(`[Module Navigator] WARNING: Element is hidden by CSS! Forcing visibility...`);
                targetEl.style.display = 'block';
                targetEl.style.visibility = 'visible';
                targetEl.style.opacity = '1';
            }
            
            // Force minimum height if element has no height
            if(parseFloat(computedStyle.height) === 0 && targetEl.children.length > 0) {
                console.warn(`[Module Navigator] WARNING: Element has 0 height! Content may not be rendering.`);
            }
            
            // Check parent containers
            let parent = targetEl.parentElement;
            let parentLevel = 0;
            while(parent && parentLevel < 5) {
                const parentStyle = window.getComputedStyle(parent);
                if(parentStyle.display === 'none' || parentStyle.visibility === 'hidden' || parentStyle.opacity === '0') {
                    console.warn(`[Module Navigator] WARNING: Parent element at level ${parentLevel} is hiding the module!`, {
                        id: parent.id,
                        classes: parent.className,
                        display: parentStyle.display,
                        visibility: parentStyle.visibility,
                        opacity: parentStyle.opacity
                    });
                    
                    // CRITICAL FIX: If parent is another module container, move this module outside
                    if(parent.id && (parent.id.includes('module') || parent.id.includes('container'))) {
                        console.error(`[Module Navigator] CRITICAL: Module ${targetId} is nested inside another module (${parent.id})! Moving it outside...`);
                        
                        // Find the correct parent (content-scroller)
                        const contentScroller = document.getElementById('content-scroller');
                        if(contentScroller && parent !== contentScroller) {
                            // Move the element to be a sibling of the parent, not a child
                            parent.parentElement.insertBefore(targetEl, parent.nextSibling);
                            console.log(`[Module Navigator] Successfully moved ${targetId} outside of ${parent.id}`);
                            
                            // Refresh modules mapping
                            MODULES = getModules();
                            // Re-get the element after moving
                            targetEl = MODULES[targetId];
                            
                            // Ensure it's visible now
                            if(targetEl) {
                                targetEl.classList.remove('hidden');
                                targetEl.style.display = 'block';
                                targetEl.style.visibility = 'visible';
                                targetEl.style.opacity = '1';
                            }
                        }
                    }
                }
                parent = parent.parentElement;
                parentLevel++;
            }
            
            // Check if element is in viewport
            const rect = targetEl.getBoundingClientRect();
            console.log(`[Module Navigator] Element bounding rect:`, {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                bottom: rect.bottom,
                right: rect.right,
                visible: rect.width > 0 && rect.height > 0
            });
            
            // Try to scroll element into view if it exists but might be off-screen
            if(rect.width > 0 && rect.height > 0) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                console.log(`[Module Navigator] Scrolled module ${targetId} into view`);
            } else {
                console.warn(`[Module Navigator] WARNING: Element has zero dimensions! This might be why it's not visible.`);
            }
            
            // Double-check after a short delay to see if something re-hides it
            setTimeout(() => {
                const recheckStyle = window.getComputedStyle(targetEl);
                const recheckRect = targetEl.getBoundingClientRect();
                const stillHidden = targetEl.classList.contains('hidden') || 
                                  recheckStyle.display === 'none' || 
                                  recheckStyle.visibility === 'hidden' || 
                                  recheckStyle.opacity === '0' ||
                                  (recheckRect.width === 0 && recheckRect.height === 0);
                
                if(stillHidden) {
                    console.error(`[Module Navigator] ERROR: Module ${targetId} was re-hidden after activation!`);
                    console.error(`[Module Navigator] Hidden class: ${targetEl.classList.contains('hidden')}`);
                    console.error(`[Module Navigator] Display: ${recheckStyle.display}`);
                    console.error(`[Module Navigator] Visibility: ${recheckStyle.visibility}`);
                    console.error(`[Module Navigator] Opacity: ${recheckStyle.opacity}`);
                    console.error(`[Module Navigator] Dimensions: ${recheckRect.width}x${recheckRect.height}`);
                    // Force it again
                    targetEl.classList.remove('hidden');
                    targetEl.style.display = 'block';
                    targetEl.style.visibility = 'visible';
                    targetEl.style.opacity = '1';
                    targetEl.style.minHeight = '200px'; // Force minimum height
                } else {
                    console.log(`[Module Navigator] Module ${targetId} remains visible after delay check.`);
                    console.log(`[Module Navigator] Final dimensions: ${recheckRect.width}x${recheckRect.height}`);
                }
            }, 200);
        }

        // 3. Update Tab Styles
        const tabs = moduleNavList.querySelectorAll('a.tab-lifted'); // Select only module tabs
        tabs.forEach(tab => {
            if(tab.dataset.moduleId === targetId) {
                tab.classList.add('tab-active', 'text-primary', 'bg-white');
                tab.classList.remove('text-gray-500');
            } else {
                tab.classList.remove('tab-active', 'text-primary', 'bg-white');
                tab.classList.add('text-gray-500');
            }
        });
    }

    function resetSelection() {
        // Return to Step 0
        moduleNavContainer.classList.add('hidden');
        selectionContainer.classList.remove('hidden');
        
        // Refresh modules mapping to ensure we have references to all current elements
        MODULES = getModules();

        // Hide all modules
        Object.values(MODULES).forEach(el => {
            if(el) {
                el.classList.add('hidden');
                // Clear inline styles that might override the hidden class
                el.style.removeProperty('display');
                el.style.removeProperty('visibility');
                el.style.removeProperty('opacity');
            }
        });

        // Clear persistence? 
        // No, keep the checks, but let user change them.
        // sessionStorage.removeItem(STORAGE_KEY); 
    }

    function saveState(ids) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }

    function restoreState() {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if(stored) {
            try {
                const ids = JSON.parse(stored);
                if(Array.isArray(ids) && ids.length > 0) {
                    
                    // Restore Checkboxes
                    if(checkThinning) checkThinning.checked = ids.includes('thinning');
                    if(checkSCC) checkSCC.checked = ids.includes('scc');
                    if(checkBrittle) checkBrittle.checked = ids.includes('brittle');
                    if(checkHTHA) checkHTHA.checked = ids.includes('htha');
                    if(checkExternal) checkExternal.checked = ids.includes('external');
                    
                    // Auto-Navigate
                    initializeNavigation(false); 
                }
            } catch(e) {
                console.warn("Formatting error in stored damage mechs", e);
            }
        }
    }

    function getModuleName(id) {
        switch(id) {
            case 'thinning': return 'Thinning DF';
            case 'scc': return 'SCC DF';
            case 'external': return 'External DF';
            case 'htha': return 'HTHA DF';
            case 'brittle': return 'Brittle Fracture DF';
            default: return id.toUpperCase();
        }
    }

});
