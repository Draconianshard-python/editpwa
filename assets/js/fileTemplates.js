const fileTemplates = {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Page</title>
</head>
<body>
    
</body>
</html>`,
    
    js: `// JavaScript File
console.log('Hello, World!');

function main() {
    // Your code here
}

main();`,
    
    css: `/* CSS File */
:root {
    /* Variables */
    --primary-color: #007AFF;
}

body {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
}`,
    
    json: `{
    "name": "New Configuration",
    "version": "1.0.0",
    "description": ""
}`
};

window.fileTemplates = fileTemplates;
