document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentLanguage = 'python';
    let versions = [];
    let socket = null;
    let roomId = null;
    let userId = Math.random().toString(36).substring(2, 8);
    let connectedUsers = [];
    
    // Initialize CodeMirror editor
    const codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        lineNumbers: true,
        theme: 'dracula',
        mode: 'python',
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        extraKeys: {
            'Ctrl-Enter': runCode,
            'Cmd-Enter': runCode
        }
    });
    
    // Set default code based on language
    setDefaultCode(currentLanguage);
    
    // Event listeners
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            currentLanguage = this.getAttribute('data-language');
            document.getElementById('currentLanguage').textContent = getLanguageName(currentLanguage);
            updateEditorMode();
            setDefaultCode(currentLanguage);
        });
    });
    
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('saveBtn').addEventListener('click', saveVersion);
    document.getElementById('shareBtn').addEventListener('click', showShareModal);
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);
    document.getElementById('collabBtn').addEventListener('click', showCollabModal);
    document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);
    document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoom);
    
    // Initialize modals
    const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
    const collabModal = new bootstrap.Modal(document.getElementById('collabModal'));
    
    // Functions
    function getLanguageName(lang) {
        const languages = {
            'python': 'Python',
            'javascript': 'JavaScript',
            'cpp': 'C++'
        };
        return languages[lang] || lang;
    }
    
    function updateEditorMode() {
        let mode;
        switch(currentLanguage) {
            case 'python':
                mode = 'python';
                break;
            case 'javascript':
                mode = 'javascript';
                break;
            case 'cpp':
                mode = 'text/x-c++src';
                break;
            default:
                mode = 'python';
        }
        codeEditor.setOption('mode', mode);
    }
    
    function setDefaultCode(language) {
        let defaultCode = '';
        switch(language) {
            case 'python':
                defaultCode = '# Welcome to Python editor\nprint("Hello, World!")\n\n# Write your Python code here';
                break;
            case 'javascript':
                defaultCode = '// Welcome to JavaScript editor\nconsole.log("Hello, World!");\n\n// Write your JavaScript code here';
                break;
            case 'cpp':
                defaultCode = '// Welcome to C++ editor\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}';
                break;
        }
        
        if (codeEditor.getValue().trim() === '' || 
            (versions.length === 0 && codeEditor.getValue().trim() === getDefaultCode(currentLanguage))) {
            codeEditor.setValue(defaultCode);
        }
    }
    
    function getDefaultCode(language) {
        switch(language) {
            case 'python':
                return '# Welcome to Python editor\nprint("Hello, World!")\n\n# Write your Python code here';
            case 'javascript':
                return '// Welcome to JavaScript editor\nconsole.log("Hello, World!");\n\n// Write your JavaScript code here';
            case 'cpp':
                return '// Welcome to C++ editor\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}';
            default:
                return '';
        }
    }
    
    function runCode() {
        const code = codeEditor.getValue();
        const outputFrame = document.getElementById('outputFrame');
        let outputDoc = outputFrame.contentDocument || outputFrame.contentWindow.document;
        
        outputDoc.open();
        outputDoc.write('<html><head><title>Output</title><style>body { font-family: Arial, sans-serif; padding: 20px; }</style></head><body>');
        
        try {
            if (currentLanguage === 'javascript') {
                outputDoc.write('<script>' + code + '<\/script>');
            } else if (currentLanguage === 'python') {
                // For Python, we would typically need a backend service to execute the code
                // This is a simple simulation
                outputDoc.write('<pre>Python execution would require a backend service.</pre>');
                outputDoc.write('<pre>For demonstration, your code is:</pre>');
                outputDoc.write('<pre>' + escapeHtml(code) + '</pre>');
            } else if (currentLanguage === 'cpp') {
                // C++ would also require a backend compiler
                outputDoc.write('<pre>C++ execution would require a backend compiler service.</pre>');
                outputDoc.write('<pre>For demonstration, your code is:</pre>');
                outputDoc.write('<pre>' + escapeHtml(code) + '</pre>');
            }
        } catch (e) {
            outputDoc.write('<pre style="color: red;">Error: ' + escapeHtml(e.message) + '</pre>');
        }
        
        outputDoc.write('</body></html>');
        outputDoc.close();
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    function saveVersion() {
        const timestamp = new Date().toLocaleString();
        const version = {
            id: Date.now(),
            code: codeEditor.getValue(),
            language: currentLanguage,
            timestamp: timestamp
        };
        
        versions.unshift(version);
        renderVersionHistory();
        
        // Show success message
        alert('Version saved successfully!');
    }
    
    function renderVersionHistory() {
        const versionHistory = document.getElementById('versionHistory');
        versionHistory.innerHTML = '';
        
        versions.forEach((version, index) => {
            const versionItem = document.createElement('a');
            versionItem.href = '#';
            versionItem.className = 'list-group-item list-group-item-action version-item';
            versionItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">Version ${versions.length - index}</h6>
                    <small>${version.timestamp}</small>
                </div>
                <small class="text-muted">${version.language}</small>
            `;
            
            versionItem.addEventListener('click', function(e) {
                e.preventDefault();
                loadVersion(version);
            });
            
            versionHistory.appendChild(versionItem);
        });
    }
    
    function loadVersion(version) {
        if (confirm('Load this version? Your current changes will be lost.')) {
            currentLanguage = version.language;
            document.getElementById('currentLanguage').textContent = getLanguageName(currentLanguage);
            updateEditorMode();
            codeEditor.setValue(version.code);
        }
    }
    
    function showShareModal() {
        const code = codeEditor.getValue();
        const encodedCode = encodeURIComponent(code);
        const shareLink = `${window.location.origin}${window.location.pathname}?code=${encodedCode}&lang=${currentLanguage}`;
        
        document.getElementById('shareLink').value = shareLink;
        shareModal.show();
    }
    
    function copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        document.execCommand('copy');
        
        const copyBtn = document.getElementById('copyLinkBtn');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    }
    
    function showCollabModal() {
        collabModal.show();
    }
    
    function joinRoom() {
        const newRoomId = document.getElementById('roomId').value.trim();
        
        if (!newRoomId) {
            alert('Please enter a room ID');
            return;
        }
        
        if (socket) {
            socket.disconnect();
        }
        
        // Connect to Socket.io server (in a real app, this would be your server URL)
        socket = io('https://socketio-server.example.com', {
            query: {
                roomId: newRoomId,
                userId: userId,
                username: `User-${userId.substring(0, 4)}`
            }
        });
        
        roomId = newRoomId;
        
        // Set up socket event listeners
        socket.on('connect', () => {
            updateUserList([{ id: userId, username: `User-${userId.substring(0, 4)}` }]);
        });
        
        socket.on('userJoined', (users) => {
            updateUserList(users);
        });
        
        socket.on('userLeft', (users) => {
            updateUserList(users);
        });
        
        socket.on('codeUpdate', (newCode) => {
            if (newCode !== codeEditor.getValue()) {
                codeEditor.setValue(newCode);
            }
        });
        
        // Listen for editor changes and broadcast to room
        codeEditor.on('change', (editor, change) => {
            if (socket && roomId) {
                socket.emit('codeChange', {
                    roomId: roomId,
                    code: editor.getValue()
                });
            }
        });
        
        alert(`Joined room: ${roomId}`);
    }
    
    function leaveRoom() {
        if (socket) {
            socket.disconnect();
            socket = null;
            roomId = null;
            updateUserList([]);
            alert('Left the room');
        }
    }
    
    function updateUserList(users) {
        connectedUsers = users;
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        
        users.forEach(user => {
            const userItem = document.createElement('li');
            userItem.className = 'list-group-item';
            userItem.innerHTML = `
                <div class="user-avatar">${user.username.substring(0, 1).toUpperCase()}</div>
                ${user.username} ${user.id === userId ? '(You)' : ''}
            `;
            userList.appendChild(userItem);
        });
    }
    
    // Check for shared code in URL
    function checkForSharedCode() {
        const params = new URLSearchParams(window.location.search);
        const sharedCode = params.get('code');
        const sharedLang = params.get('lang');
        
        if (sharedCode && sharedLang) {
            if (confirm('Load shared code?')) {
                currentLanguage = sharedLang;
                document.getElementById('currentLanguage').textContent = getLanguageName(currentLanguage);
                updateEditorMode();
                codeEditor.setValue(decodeURIComponent(sharedCode));
                
                // Clean the URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
    
    checkForSharedCode();
});