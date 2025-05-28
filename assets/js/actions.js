import { icons, createIcon, addIconToButton } from './icons.js';

export class ActionManager {
    constructor(app) {
        this.app = app;
        this.setupActions();
    }

    setupActions() {
        // File actions
        this.setupFileActions();
        
        // Edit actions
        this.setupEditActions();
        
        // View actions
        this.setupViewActions();
        
        // Navigation actions
        this.setupNavigationActions();
        
        // Tool actions
        this.setupToolActions();
    }

    setupFileActions() {
        // New file button
        const newFileBtn = document.getElementById('newFileBtn');
        addIconToButton(newFileBtn, 'new', 'New File');
        newFileBtn.onclick = () => this.app.showNewFileDialog();

        // Save button
        const saveButton = document.getElementById('saveButton');
        addIconToButton(saveButton, 'save', 'Save');
        saveButton.onclick = () => this.app.saveCurrentFile();

        // Delete file action
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = (e) => {
                const file = e.target.closest('.file-item')?.dataset.path;
                if (file) this.app.deleteFile(file);
            };
        });
    }

    setupEditActions() {
        // Undo
        this.registerEditorAction('undo', () => this.app.editor.trigger('keyboard', 'undo'));
        
        // Redo
        this.registerEditorAction('redo', () => this.app.editor.trigger('keyboard', 'redo'));
        
        // Cut
        this.registerEditorAction('cut', () => document.execCommand('cut'));
        
        // Copy
        this.registerEditorAction('copy', () => document.execCommand('copy'));
        
        // Paste
        this.registerEditorAction('paste', () => document.execCommand('paste'));
    }

    setupViewActions() {
        // Toggle sidebar
        const toggleSidebarBtn = document.getElementById('toggleSidebar');
        if (toggleSidebarBtn) {
            addIconToButton(toggleSidebarBtn, 'left');
            toggleSidebarBtn.onclick = () => this.app.toggleSidebar();
        }

        // Toggle terminal
        const toggleTerminalBtn = document.getElementById('toggleTerminal');
        if (toggleTerminalBtn) {
            addIconToButton(toggleTerminalBtn, 'terminal');
            toggleTerminalBtn.onclick = () => this.app.toggleTerminal();
        }

        // Split editor
        const splitEditorBtn = document.getElementById('splitEditorBtn');
        if (splitEditorBtn) {
            addIconToButton(splitEditorBtn, 'split');
            splitEditorBtn.onclick = () => this.app.splitEditor();
        }
    }

    setupNavigationActions() {
        // Activity bar items
        const activities = {
            explorer: { icon: 'explorer', action: () => this.app.showView('explorer') },
            search: { icon: 'search', action: () => this.app.showView('search') },
            git: { icon: 'git', action: () => this.app.showView('git') },
            debug: { icon: 'debug', action: () => this.app.showView('debug') },
            extensions: { icon: 'extensions', action: () => this.app.showView('extensions') },
            settings: { icon: 'settings', action: () => this.app.showView('settings') }
        };

        for (const [id, { icon, action }] of Object.entries(activities)) {
            const element = document.querySelector(`[data-view="${id}"]`);
            if (element) {
                const iconEl = createIcon(icon);
                element.innerHTML = '';
                element.appendChild(iconEl);
                element.onclick = action;
            }
        }
    }

    setupToolActions() {
        // Run button
        const runButton = document.getElementById('runButton');
        if (runButton) {
            addIconToButton(runButton, 'run', 'Run');
            runButton.onclick = () => this.app.runCurrentFile();
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            addIconToButton(refreshBtn, 'refresh');
            refreshBtn.onclick = () => this.app.refreshFileList();
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const searchIcon = createIcon('search');
            searchInput.parentNode.insertBefore(searchIcon, searchInput);
            searchInput.oninput = (e) => this.app.searchFiles(e.target.value);
        }
    }

    registerEditorAction(name, callback) {
        const button = document.querySelector(`[data-action="${name}"]`);
        if (button) {
            addIconToButton(button, name);
            button.onclick = callback;
        }
    }

    // Additional action methods
    splitEditor() {
        const editorContainer = document.querySelector('.editor-container');
        editorContainer.classList.toggle('split');
        if (editorContainer.classList.contains('split')) {
            // Create second editor instance
            const secondEditor = monaco.editor.create(
                document.createElement('div'),
                this.app.editor.getRawOptions()
            );
            editorContainer.appendChild(secondEditor.getDomNode());
        } else {
            // Remove second editor
            const editors = editorContainer.querySelectorAll('.monaco-editor');
            if (editors.length > 1) {
                editors[1].remove();
            }
        }
    }

    toggleTerminal() {
        const terminal = document.getElementById('terminal-container');
        if (!terminal) {
            this.createTerminal();
        } else {
            terminal.classList.toggle('hidden');
        }
    }

    createTerminal() {
        const container = document.createElement('div');
        container.id = 'terminal-container';
        container.className = 'terminal-container';
        
        const header = document.createElement('div');
        header.className = 'terminal-header';
        addIconToButton(header, 'terminal', 'Terminal');
        
        const closeBtn = document.createElement('button');
        addIconToButton(closeBtn, 'close');
        closeBtn.onclick = () => container.classList.add('hidden');
        header.appendChild(closeBtn);
        
        const terminal = document.createElement('div');
        terminal.className = 'terminal-content';
        
        container.appendChild(header);
        container.appendChild(terminal);
        document.querySelector('.editor-container').appendChild(container);
        
        // Initialize terminal (you can use xterm.js here)
        // this.initializeTerminal(terminal);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = createIcon(type);
        const text = document.createElement('span');
        text.textContent = message;
        
        notification.appendChild(icon);
        notification.appendChild(text);
        
        const container = document.querySelector('.notification-container') || 
            (() => {
                const cont = document.createElement('div');
                cont.className = 'notification-container';
                document.body.appendChild(cont);
                return cont;
            })();
            
        container.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}
