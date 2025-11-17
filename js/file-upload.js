// File Upload Component with Validation
class FileUploadManager {
    constructor() {
        this.allowedTypes = {
            'PDF': {
                mimes: ['application/pdf'],
                extensions: ['.pdf'],
                maxSize: 10 * 1024 * 1024 // 10MB
            },
            'DOC': {
                mimes: [
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                extensions: ['.doc', '.docx'],
                maxSize: 10 * 1024 * 1024 // 10MB
            },
            'PPT': {
                mimes: [
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                ],
                extensions: ['.ppt', '.pptx'],
                maxSize: 20 * 1024 * 1024 // 20MB
            },
            'XLS': {
                mimes: [
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ],
                extensions: ['.xls', '.xlsx'],
                maxSize: 10 * 1024 * 1024 // 10MB
            },
            'Video': {
                mimes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
                extensions: ['.mp4', '.mpeg', '.mov', '.avi'],
                maxSize: 100 * 1024 * 1024 // 100MB
            },
            'Other': {
                mimes: ['*'],
                extensions: ['*'],
                maxSize: 25 * 1024 * 1024 // 25MB
            }
        };
    }

    validateFile(file, selectedType) {
        const errors = [];

        // Check if file exists
        if (!file) {
            errors.push('No file selected');
            return { valid: false, errors };
        }

        // Check if type is valid
        if (!this.allowedTypes[selectedType]) {
            errors.push('Invalid file type selected');
            return { valid: false, errors };
        }

        const typeConfig = this.allowedTypes[selectedType];

        // Check file size
        if (file.size > typeConfig.maxSize) {
            const maxSizeMB = (typeConfig.maxSize / (1024 * 1024)).toFixed(0);
            errors.push(`File size exceeds ${maxSizeMB}MB limit`);
        }

        // Check MIME type (unless "Other" is selected)
        if (selectedType !== 'Other') {
            if (!typeConfig.mimes.includes(file.type)) {
                errors.push(
                    `File type mismatch. Selected "${selectedType}" but uploaded file is "${file.type}". ` +
                    `Expected: ${typeConfig.mimes.join(', ')}`
                );
            }
        }

        // Check file extension
        const fileName = file.name.toLowerCase();
        const fileExtension = '.' + fileName.split('.').pop();
        
        if (selectedType !== 'Other' && !typeConfig.extensions.some(ext => fileName.endsWith(ext))) {
            errors.push(
                `Invalid file extension. Expected: ${typeConfig.extensions.join(', ')}`
            );
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            file: file,
            size: file.size,
            type: file.type,
            name: file.name
        };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    getAcceptedFormats(selectedType) {
        if (!this.allowedTypes[selectedType]) return '*';
        const config = this.allowedTypes[selectedType];
        return config.extensions.join(',');
    }

    async uploadWithProgress(file, metadata, onProgress) {
        try {
            // Validate file first
            const validation = this.validateFile(file, metadata.fileType);
            if (!validation.valid) {
                throw new Error(validation.errors.join('. '));
            }

            // Create unique filename
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = `${timestamp}_${sanitizedName}`;
            const storageRef = firebase.storage().ref(`resources/${filename}`);

            // Create upload task
            const uploadTask = storageRef.put(file, {
                contentType: file.type,
                customMetadata: {
                    authorId: metadata.authorId,
                    subject: metadata.subject,
                    originalName: file.name
                }
            });

            // Monitor upload progress
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress, snapshot.state);
                    }
                },
                (error) => {
                    console.error('Upload error:', error);
                    throw error;
                },
                async () => {
                    // Upload completed successfully
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Save metadata to Firestore
                    const resourceRef = await firebase.firestore().collection('resources').add({
                        authorId: metadata.authorId,
                        authorName: metadata.authorName,
                        title: metadata.title,
                        description: metadata.description,
                        subject: metadata.subject,
                        fileType: metadata.fileType,
                        fileName: file.name,
                        fileSize: file.size,
                        downloadURL: downloadURL,
                        storagePath: uploadTask.snapshot.ref.fullPath,
                        views: 0,
                        downloads: 0,
                        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    return {
                        id: resourceRef.id,
                        downloadURL: downloadURL,
                        ...metadata
                    };
                }
            );

            // Return the upload task for promise handling
            return uploadTask;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    createFileInput(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const fileInputHTML = `
            <div class="file-upload-container">
                <div class="file-upload-area" id="${containerId}_dropzone">
                    <input 
                        type="file" 
                        id="${containerId}_input" 
                        class="file-input-hidden" 
                        accept="${options.accept || '*'}"
                        style="display: none;"
                    />
                    <div class="file-upload-content">
                        <span class="file-upload-icon">📁</span>
                        <p class="file-upload-text">
                            <strong>Click to upload</strong> or drag and drop
                        </p>
                        <p class="file-upload-hint">
                            ${options.hint || 'Select a file to upload'}
                        </p>
                    </div>
                </div>
                <div id="${containerId}_preview" class="file-preview" style="display: none;">
                    <div class="file-preview-content">
                        <span class="file-preview-icon">📄</span>
                        <div class="file-preview-info">
                            <p class="file-preview-name"></p>
                            <p class="file-preview-size"></p>
                        </div>
                        <button type="button" class="file-preview-remove" onclick="fileUploadManager.removeFile('${containerId}')">✕</button>
                    </div>
                    <div id="${containerId}_progress" class="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <p class="progress-text">Uploading... 0%</p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = fileInputHTML;

        // Set up event listeners
        const dropzone = document.getElementById(`${containerId}_dropzone`);
        const fileInput = document.getElementById(`${containerId}_input`);

        dropzone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(containerId, e.target.files[0]);
            }
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(containerId, e.dataTransfer.files[0]);
            }
        });
    }

    handleFileSelect(containerId, file) {
        const preview = document.getElementById(`${containerId}_preview`);
        const dropzone = document.getElementById(`${containerId}_dropzone`);
        
        // Show preview
        preview.style.display = 'block';
        dropzone.style.display = 'none';

        // Update preview info
        preview.querySelector('.file-preview-name').textContent = file.name;
        preview.querySelector('.file-preview-size').textContent = this.formatFileSize(file.size);

        // Store file reference
        this.selectedFiles = this.selectedFiles || {};
        this.selectedFiles[containerId] = file;
    }

    removeFile(containerId) {
        const preview = document.getElementById(`${containerId}_preview`);
        const dropzone = document.getElementById(`${containerId}_dropzone`);
        const fileInput = document.getElementById(`${containerId}_input`);

        preview.style.display = 'none';
        dropzone.style.display = 'block';
        fileInput.value = '';

        if (this.selectedFiles) {
            delete this.selectedFiles[containerId];
        }
    }

    getFile(containerId) {
        return this.selectedFiles ? this.selectedFiles[containerId] : null;
    }

    showProgress(containerId, show = true) {
        const progress = document.getElementById(`${containerId}_progress`);
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
        }
    }

    updateProgress(containerId, percent, state) {
        const progressFill = document.querySelector(`#${containerId}_progress .progress-fill`);
        const progressText = document.querySelector(`#${containerId}_progress .progress-text`);

        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }

        if (progressText) {
            const stateText = state === 'running' ? 'Uploading' : state === 'paused' ? 'Paused' : 'Processing';
            progressText.textContent = `${stateText}... ${Math.round(percent)}%`;
        }
    }
}

// Initialize file upload manager
const fileUploadManager = new FileUploadManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
}