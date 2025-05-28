// Monaco Editor configuration
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

class PWAApp {
    constructor() {
        this.editor = null;
        this.currentFile = null;
        this.files = new Map();
        this.originalContent = new Map();
        
        // Initialize the application
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
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    theme: 'vs-dark',
                    fontSize: 14,
                    minimap: { enabled: true },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    renderWhitespace: 'boundary',
                    rulers: [80, 120],
                });
                
                // Setup file change detection
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
        document.getElementById('saveButton').addEventListener('click', () => this.saveCurrentFile());
        document.getElementById('file-selector').addEventListener('change', (e) => this.loadFile(e.target.value));
    }

    async loadFileList() {
        const defaultFiles = [
            { name: 'index.html', path: 'index.html' },
            { name: 'style.css', path: 'assets/css/style.css' },
            { name: 'app.js', path: 'assets/js/app.js' },
            { name: 'manifest.json', path: 'manifest.json' },
            { name: 'service-worker.js', path: 'service-worker.js' }
        ];

        const fileList = document.getElementById('file-list');
        const fileSelector = document.getElementById('file-selector');

        // Load files from localStorage or use defaults
        const savedFiles = localStorage.getItem('pwa-files');
        const files = savedFiles ? JSON.parse(savedFiles) : defaultFiles;

        // Clear existing options
        fileList.innerHTML = '';
        fileSelector.innerHTML = '<option value="">Select a file to edit...</option>';

        // Add files to UI
        files.forEach(file => {
            // Add to file list
            const li = document.createElement('li');
            li.className = 'file-item';
            li.textContent = file.name;
            li.addEventListener('click', () => this.loadFile(file.path));
            fileList.appendChild(li);

            // Add to selector
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = file.path;
            fileSelector.appendChild(option);

            // Load file content
            this.loadFileContent(file.path);
        });
    }

    async loadFileContent(filePath) {
        // Try to load from localStorage first
        const savedContent = localStorage.getItem(`file:${filePath}`);
        if (savedContent) {
            this.files.set(filePath, savedContent);
            this.originalContent.set(filePath, savedContent);
            return;
        }

        // If not in localStorage, load default content
        try {
            const response = await fetch(filePath);
            const content = await response.text();
            this.files.set(filePath, content);
            this.originalContent.set(filePath, content);
            localStorage.setItem(`file:${filePath}`, content);
        } catch (error) {
            console.error(`Error loading file ${filePath}:`, error);
        }
    }

    async loadFile(filePath) {
        if (!filePath) return;

        this.currentFile = filePath;
        
        // Update UI
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.toggle('active', item.textContent === filePath);
        });

        // Get file content
        let content = this.files.get(filePath) || '';
        
        // Set language based on file extension
        const extension = filePath.split('.').pop();
        const language = this.getLanguageFromExtension(extension);
        
        // Create new model with appropriate language
        const model = monaco.editor.createModel(content, language);
        this.editor.setModel(model);
        
        // Update status bar
        document.getElementById('file-info').textContent = `${filePath} - ${language}`;
        
        // Reset save button state
        document.getElementById('saveButton').disabled = true;
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
        
        // Show save notification
        this.showNotification('File saved successfully!');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
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
