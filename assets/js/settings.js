export class Settings {
    constructor() {
        this.settings = this.loadSettings();
        this.setupEventListeners();
        this.applySettings();
    }

    loadSettings() {
        const defaultSettings = {
            editor: {
                fontSize: 14,
                tabSize: 4,
                wordWrap: 'off',
                minimap: true,
                theme: 'vs-dark',
                iconTheme: 'vscode',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace'
            },
            terminal: {
                integrated: true,
                fontSize: 12
            },
            ui: {
                theme: 'vscode',
                zoom: 100,
                sidebarPosition: 'left'
            },
            files: {
                autoSave: 'afterDelay',
                autoSaveDelay: 1000,
                eol: '\n'
            }
        };

        const savedSettings = localStorage.getItem('app-settings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('app-settings', JSON.stringify(this.settings));
        this.applySettings();
    }

    setupEventListeners() {
        // Editor settings
        document.getElementById('setting-fontSize')?.addEventListener('change', (e) => {
            this.settings.editor.fontSize = parseInt(e.target.value);
            this.saveSettings();
        });

        document.getElementById('setting-tabSize')?.addEventListener('change', (e) => {
            this.settings.editor.tabSize = parseInt(e.target.value);
            this.saveSettings();
        });

        document.getElementById('setting-wordWrap')?.addEventListener('change', (e) => {
            this.settings.editor.wordWrap = e.target.value;
            this.saveSettings();
        });

        document.getElementById('setting-minimap')?.addEventListener('change', (e) => {
            this.settings.editor.minimap = e.target.checked;
            this.saveSettings();
        });

        // Theme settings
        document.getElementById('setting-theme')?.addEventListener('change', (e) => {
            this.settings.editor.theme = e.target.value;
            this.settings.ui.theme = e.target.value.includes('xcode') ? 'xcode' : 'vscode';
            this.saveSettings();
        });

        document.getElementById('setting-iconTheme')?.addEventListener('change', (e) => {
            this.settings.editor.iconTheme = e.target.value;
            this.saveSettings();
        });

        // Terminal settings
        document.getElementById('setting-terminal')?.addEventListener('change', (e) => {
            this.settings.terminal.integrated = e.target.checked;
            this.saveSettings();
        });
    }

    applySettings() {
        // Apply theme
        document.body.className = `theme-${this.settings.ui.theme}`;

        // Apply editor settings if Monaco editor is available
        if (window.editor) {
            window.editor.updateOptions({
                fontSize: this.settings.editor.fontSize,
                tabSize: this.settings.editor.tabSize,
                wordWrap: this.settings.editor.wordWrap,
                minimap: {
                    enabled: this.settings.editor.minimap
                },
                fontFamily: this.settings.editor.fontFamily
            });

            monaco.editor.setTheme(this.settings.editor.theme);
        }

        // Update UI elements to reflect current settings
        this.updateSettingsUI();
        
        // Emit settings changed event
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    }

    updateSettingsUI() {
        // Update input values
        const elements = {
            'setting-fontSize': this.settings.editor.fontSize,
            'setting-tabSize': this.settings.editor.tabSize,
            'setting-wordWrap': this.settings.editor.wordWrap,
            'setting-minimap': this.settings.editor.minimap,
            'setting-theme': this.settings.editor.theme,
            'setting-iconTheme': this.settings.editor.iconTheme,
            'setting-terminal': this.settings.terminal.integrated
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        }
    }

    getSetting(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.settings);
    }

    setSetting(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const obj = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.settings);
        obj[lastKey] = value;
        this.saveSettings();
    }
}

// Initialize settings when the module is imported
export const settings = new Settings();
