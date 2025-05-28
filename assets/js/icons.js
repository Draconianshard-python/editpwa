// Standard icon mapping
export const icons = {
    // File types
    file: 'fa-regular fa-file',
    fileCode: 'fa-regular fa-file-code',
    fileImage: 'fa-regular fa-file-image',
    fileText: 'fa-regular fa-file-lines',
    
    // Actions
    new: 'fa-solid fa-plus',
    save: 'fa-solid fa-floppy-disk',
    delete: 'fa-solid fa-trash',
    edit: 'fa-solid fa-pen',
    run: 'fa-solid fa-play',
    stop: 'fa-solid fa-stop',
    refresh: 'fa-solid fa-rotate',
    search: 'fa-solid fa-magnifying-glass',
    settings: 'fa-solid fa-gear',
    close: 'fa-solid fa-xmark',
    
    // UI Elements
    explorer: 'fa-solid fa-folder',
    git: 'fa-brands fa-git-alt',
    debug: 'fa-solid fa-bug',
    extensions: 'fa-solid fa-puzzle-piece',
    terminal: 'fa-solid fa-terminal',
    split: 'fa-solid fa-columns',
    
    // Status
    warning: 'fa-solid fa-triangle-exclamation',
    error: 'fa-solid fa-circle-exclamation',
    success: 'fa-solid fa-circle-check',
    info: 'fa-solid fa-circle-info',
    
    // Navigation
    left: 'fa-solid fa-chevron-left',
    right: 'fa-solid fa-chevron-right',
    up: 'fa-solid fa-chevron-up',
    down: 'fa-solid fa-chevron-down',
    
    // Editor
    undo: 'fa-solid fa-undo',
    redo: 'fa-solid fa-redo',
    copy: 'fa-regular fa-copy',
    cut: 'fa-solid fa-scissors',
    paste: 'fa-solid fa-paste'
};

// Helper function to create icon element
export function createIcon(iconName) {
    const i = document.createElement('i');
    const iconClass = icons[iconName] || iconName;
    i.className = iconClass;
    return i;
}

// Helper function to add icon to button
export function addIconToButton(button, iconName, text = '') {
    button.innerHTML = '';
    button.appendChild(createIcon(iconName));
    if (text) {
        const span = document.createElement('span');
        span.textContent = ' ' + text;
        button.appendChild(span);
    }
    return button;
}
