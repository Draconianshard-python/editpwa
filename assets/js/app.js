class PWAApp {
    constructor() {
        this.initializeApp();
    }

    initializeApp() {
        this.setupServiceWorker();
        this.setupTimeDisplay();
        this.setupInstallButton();
        this.loadContent();
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

    loadContent() {
        const savedContent = localStorage.getItem('pwaContent');
        if (savedContent) {
            const { title, content, lastModified } = JSON.parse(savedContent);
            document.getElementById('title').textContent = title;
            document.getElementById('content').textContent = content;
            document.getElementById('lastModified').textContent = 
                `Last modified: ${new Date(lastModified).toLocaleString()}`;
        }
    }
}

// Initialize the app
window.addEventListener('load', () => {
    new PWAApp();
});
