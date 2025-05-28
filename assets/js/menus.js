export class MenuManager {
    constructor() {
        this.activeMenus = new Set();
        this.setupMenus();
        this.setupContextMenus();
        this.setupCommandPalette();
    }

    setupMenus() {
        const menuItems = {
            file: [
                { label: 'New File...', shortcut: '⌘N', action: () => this.createFile() },
                { label: 'New Window', shortcut: '⌘⇧N', action: () => this.createWindow() },
                { type: 'separator' },
                { label: 'Save', shortcut: '⌘S', action: () => this.saveFile() },
                { label: 'Save As...', shortcut: '⌘⇧S', action: () => this.saveFileAs() },
                { type: 'separator' },
                { label: 'Exit', shortcut: '⌘Q', action: () => this.exit() }
            ],
            edit: [
                { label: 'Undo', shortcut: '⌘Z', action: () => this.undo() },
                { label: 'Redo', shortcut: '⌘⇧Z', action: () => this.redo() },
                { type: 'separator' },
                { label: 'Cut', shortcut: '⌘X', action: () => this.cut() },
                { label: 'Copy', shortcut: '⌘C', action: () => this.copy() },
                { label: 'Paste', shortcut: '⌘V', action: () => this.paste() }
            ],
            view: [
                { label: 'Command Palette...', shortcut: '⌘⇧P', action: () => this.showCommandPalette() },
                { type: 'separator' },
                { label: 'Explorer', shortcut: '⌘⇧E', action: () => this.toggleView('explorer') },
                { label: 'Search', shortcut: '⌘⇧F', action: () => this.toggleView('search') },
                { label: 'Source Control', shortcut: '⌘⇧G', action: () => this.toggleView('git') },
                { label: 'Debug', shortcut: '⌘⇧D', action: () => this.toggleView('debug') },
                { type: 'separator' },
                { label: 'Terminal', shortcut: '⌘`', action: () => this.toggleTerminal() }
            ]
        };

        // Setup menu click handlers
        document.querySelectorAll('.menu-item[data-menu]').forEach(menuElement => {
            menuElement.addEventListener('click', (e) => {
                this.toggleMenu(e.target.dataset.menu, menuElement);
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-item')) {
                this.closeAllMenus();
            }
        });

        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Command palette
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.showCommandPalette();
            }
            
            // Other shortcuts...
        });
    }

    toggleMenu(menuId, element) {
        if (this.activeMenus.has(menuId)) {
            this.closeMenu(menuId);
        } else {
            this.openMenu(menuId, element);
        }
    }

    openMenu(menuId, element) {
        this.closeAllMenus();
        
        const menuData = this.menus[menuId];
        if (!menuData) return;

        const menu = document.createElement('div');
        menu.className = 'menu-dropdown';
        menu.id = `menu-${menuId}`;

        menuData.forEach(item => {
            if (item.type === 'separator') {
                menu.appendChild(this.createSeparator());
            } else {
                menu.appendChild(this.createMenuItem(item));
            }
        });

        // Position the menu
        const rect = element.getBoundingClientRect();
        menu.style.top = `${rect.bottom}px`;
        menu.style.left = `${rect.left}px`;

        document.body.appendChild(menu);
        this.activeMenus.add(menuId);
    }

    closeMenu(menuId) {
        const menu = document.getElementById(`menu-${menuId}`);
        if (menu) {
            menu.remove();
            this.activeMenus.delete(menuId);
        }
    }

    closeAllMenus() {
        this.activeMenus.forEach(menuId => this.closeMenu(menuId));
        this.activeMenus.clear();
    }

    createMenuItem(item) {
        const div = document.createElement('div');
        div.className = 'menu-item';
        
        const label = document.createElement('span');
        label.className = 'menu-label';
        label.textContent = item.label;
        div.appendChild(label);

        if (item.shortcut) {
            const shortcut = document.createElement('span');
