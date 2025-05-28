class PWAApp {
    constructor() {
        this.editor = null;
        this.currentFile = null;
        this.files = new Map();
        this.originalContent = new Map();
        this.outputVisible = false;
        
        this.initializeApp();
    }

    async initializeApp() {
        await this.setupMonacoEditor();
        this.setupServiceWorker();
        this.setupTimeDisplay();
        this.setupInstallButton();
        this.setupEventListeners();
        await this.loadFileList();
    }

    async setupMonacoEditor() {
        return new Promise((resolve) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    theme: 'vs-dark',
                    fontSize: 14,
                    minimap: { enabled: true },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                });
                
                this.editor.onDidChangeModelContent(() => {
                    if (this.currentFile) {
                        const hasChanges = this.editor.getValue() !== this.originalContent.get(this.currentFile);
                        document.getElementById('saveButton').disabled = !hasChanges;
                    }
                });
                
                resolve();
            });
        });
    }

    setupTimeDisplay() {
        const updateTime = () => {
            const now = new Date();
            const utcString = now.toISOString()
                .replace('T', ' ')
                .replace(/\.\d+Z$/, '');
            document.getElementById('utc-time').textContent = utcString;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    setupEventListeners() {
        // File management
        document.getElementById('newFileBtn').addEventListener('click', () => this.showNewFileDialog());
        document.getElementById('saveButton').addEventListener('click', () => this.saveCurrentFile());
        document.getElementById('runButton').addEventListener('click', () => this.runCurrentFile());
        
        // Dialog events
        document.getElementById('createFileBtn').addEventListener('click', () => this.createNewFile());
        document.getElementById('cancelFileBtn').addEventListener('click', () => this.hideNewFileDialog());
        document.getElementById('closeOutput').addEventListener('click', () => this.toggleOutput(false));

        // File type selection
        document.getElementById('fileTemplate').addEventListener('change', (e) => {
            const template = e.target.value;
            if (template && window.fileTemplates[template]) {
                document.getElementById('newFileName').value = `new.${template}`;
            }
        });
    }

    showNewFileDialog() {
        document.getElementById('newFileDialog').style.display = 'flex';
        document.getElementById('newFileName').focus();
    }

    hideNewFileDialog() {
        document.getElementById('newFileDialog').style.display = 'none';
        document.getElementById('newFileName').value = '';
        document.getElementById('fileTemplate').value = '';
    }

    async createNewFile() {
        const fileName = document.getElementById('newFileName').value.trim();
        const template = document.getElementById('fileTemplate').value;
        
        if (!fileName) {
            this.showNotification('Please enter a file name', 'error');
            return;
        }

        let content = '';
        if (template && window.fileTemplates[template]) {
            content = window.fileTemplates[template];
        }

        // Save the new file
        this.files.set(fileName, content);
        this.originalContent.set(fileName, content);
        localStorage.setItem(`file:${fileName}`, content);
        
        // Update file list
        await this.loadFileList();
        
        // Load the new file in editor
        this.loadFile(fileName);
        
        // Hide dialog
        this.hideNewFileDialog();
        this.showNotification(`Created file: ${fileName}`);
    }

    async loadFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';

        // Get all files from localStorage
        const files = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('file:')) {
                files.add(key.replace('file:', ''));
            }
        }

        // Add default files if no files exist
        if (files.size === 0) {
            const defaultFiles = [
                'index.html',
                'assets/css/style.css',
                'assets/js/app.js',
                'manifest.json',
                'service-worker.js'
            ];
            
            for (const file of defaultFiles) {
                try {
                    const response = await fetch(file);
                    const content = await response.text();
                    this.files.set(file, content);
                    this.originalContent.set(file, content);
                    localStorage.setItem(`file:${file}`, content);
                    files.add(file);
                } catch (error) {
                    console.error(`Error loading file ${file}:`, error);
                }
            }
        }

        // Create file list items
        for (const file of files) {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <span class="file-icon">${this.getFileIcon(file)}</span>
                <span class="file-name">${file}</span>
            `;
            li.addEventListener('click', () => this.loadFile(file));
            fileList.appendChild(li);
        }
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop();
        const icons = {
            html: '📄',
            css: '🎨',
            js: '📜',
            json: '⚙️',
            default: '📝'
        };
        return icons[ext] || icons.default;
    }

    async loadFile(filePath) {
        if (!filePath) return;

        this.currentFile = filePath;
        
        // Update UI
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.toggle('active', 
                item.querySelector('.file-name').textContent === filePath);
        });

        // Get file content
        let content = localStorage.getItem(`file:${filePath}`);
        if (!content) {
            try {
                const response = await fetch(filePath);
                content = await response.text();
                localStorage.setItem(`file:${filePath}`, content);
            } catch (error) {
                console.error(`Error loading file ${filePath}:`, error);
                content = '';
            }
        }

        this.files.set(filePath, content);
        this.originalContent.set(filePath, content);
        
        // Set language based on file extension
        const extension = filePath.split('.').pop();
        const language = this.getLanguageFromExtension(extension);
        
        // Create new model with appropriate language
        const model = monaco.editor.createModel(content, language);
        this.editor.setModel(model);
        
        // Update status bar
        document.getElementById('current-file').textContent = filePath;
        document.getElementById('saveButton').disabled = true;
        
        // Enable/disable run button for JavaScript files
        document.getElementById('runButton').disabled = language !== 'javascript';
    }

    getLanguageFromExtension(extension) {
        const languageMap = {
            'js': 'javascript',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'md': 'markdown'
        };
        return languageMap[extension] || 'plaintext';
    }

    async saveCurrentFile() {
        if (!this.currentFile) return;

        const content = this.editor.getValue();
        
        // Save to localStorage
        localStorage.setItem(`file:${this.currentFile}`, content);
        
        // Update our maps
        this.files.set(this.currentFile, content);
        this.originalContent.set(this.currentFile, content);
        
        // Update UI
        document.getElementById('saveButton').disabled = true;
        document.getElementById('lastModified').textContent = 
            `Last saved: ${new Date().toLocaleString()}`;
        
        this.showNotification('File saved successfully!');
    }

    runCurrentFile() {
        const content = this.editor.getValue();
        const outputContainer = document.getElementById('output-container');
        const outputContent = document.getElementById('output-content');
        
        // Show output container
        this.toggleOutput(true);
        
        // Capture console output
        const log = [];
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };

        console.log = (...args) => {
            log.push(['log', ...args]);
            originalConsole.log(...args);
        };
        console.error = (...args) => {
            log.push(['error', ...args]);
            originalConsole.error(...args);
        };
        console.warn = (...args) => {
            log.push(['warn', ...args]);
            originalConsole.warn(...args);
        };
        console.info = (...args) => {
            log.push(['info', ...args]);
            originalConsole.info(...args);
        };

        try {
            // Create a new Function from the content and execute it
            const func = new Function(content);
            func();
            
            // Display output
            outputContent.innerHTML = log.map(([type, ...args]) => {
                const color = {
                    log: '#fff',
                    error: '#ff5555',
                    warn: '#ffb86c',
                    info: '#8be9fd'
                }[type];
                return `<span style="color: ${color}">${args.join(' ')}</span>`;
            }).join('\n');
        } catch (error) {
            outputContent.innerHTML = `<span style="color: #ff5555">Error: ${error.message}</span>`;
        } finally {
            // Restore original console
            Object.assign(console, originalConsole);
        }
    }

    toggleOutput(show) {
        const outputContainer = document.getElementById('output-container');
        this.outputVisible = show;
        outputContainer.style.display = show ? 'block' : 'none';
        if (!show) {
            document.getElementById('output-content').innerHTML = '';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.style.opacity = '1', 100);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('service-worker.js');
                console.log('ServiceWorker registered:', registration);
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }

    setupInstallButton() {
        let deferredPrompt;
        const installButton = document.getElementById('installButton');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'inline-block';
        });

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install prompt: ${outcome}`);
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });
    }
}

// Initialize the app when the window loads
window.addEventListener('load', () => {
    new PWAApp();
});
