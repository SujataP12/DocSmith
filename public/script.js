class DocumentConverter {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.selectedFile = null;
    }

    initializeElements() {
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.removeFileBtn = document.getElementById('removeFile');
        this.conversionForm = document.getElementById('conversionForm');
        this.convertBtn = document.getElementById('convertBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultSection = document.getElementById('resultSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newConversionBtn = document.getElementById('newConversionBtn');
    }

    attachEventListeners() {
        // File upload events
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.fileUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.fileUploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.removeFileBtn.addEventListener('click', this.removeFile.bind(this));

        // Form events
        this.conversionForm.addEventListener('submit', this.handleConversion.bind(this));
        this.conversionForm.addEventListener('change', this.updateConvertButton.bind(this));

        // Result events
        this.newConversionBtn.addEventListener('click', this.resetForm.bind(this));

        // Browse link
        document.querySelector('.browse-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.click();
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        const allowedTypes = ['.pdf', '.docx', '.doc', '.csv'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showError('Please select a valid file type (PDF, DOCX, DOC, or CSV)');
            return;
        }

        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            this.showError('File size must be less than 50MB');
            return;
        }

        this.selectedFile = file;
        this.displayFileInfo(file);
        this.updateConvertButton();
    }

    displayFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        
        this.fileUploadArea.style.display = 'none';
        this.fileInfo.style.display = 'block';
    }

    removeFile() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.fileUploadArea.style.display = 'block';
        this.fileInfo.style.display = 'none';
        this.updateConvertButton();
    }

    updateConvertButton() {
        const conversionType = document.querySelector('input[name="conversionType"]:checked');
        const hasFile = this.selectedFile !== null;
        
        this.convertBtn.disabled = !(hasFile && conversionType);
    }

    async handleConversion(e) {
        e.preventDefault();
        
        if (!this.selectedFile) {
            this.showError('Please select a file');
            return;
        }

        const conversionType = document.querySelector('input[name="conversionType"]:checked');
        if (!conversionType) {
            this.showError('Please select a conversion type');
            return;
        }

        this.showProgress();
        
        try {
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            formData.append('conversionType', conversionType.value);

            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Conversion failed');
            }

            const result = await response.json();
            this.showResult(result);

        } catch (error) {
            console.error('Conversion error:', error);
            this.showError(error.message || 'An error occurred during conversion');
        }
    }

    showProgress() {
        this.conversionForm.style.display = 'none';
        this.progressSection.style.display = 'block';
        this.resultSection.style.display = 'none';

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            this.progressFill.style.width = progress + '%';
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
    }

    showResult(result) {
        this.progressFill.style.width = '100%';
        
        setTimeout(() => {
            this.progressSection.style.display = 'none';
            this.resultSection.style.display = 'block';
            
            this.downloadBtn.href = result.downloadUrl;
            this.downloadBtn.download = result.filename;
        }, 500);
    }

    showError(message) {
        this.hideProgress();
        
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button class="close-error">&times;</button>
            </div>
        `;
        
        // Add error styles
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
        
        // Manual close
        errorDiv.querySelector('.close-error').addEventListener('click', () => {
            errorDiv.remove();
        });
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
        this.conversionForm.style.display = 'block';
    }

    resetForm() {
        this.removeFile();
        this.conversionForm.style.display = 'block';
        this.progressSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        
        // Reset radio buttons
        document.querySelectorAll('input[name="conversionType"]').forEach(radio => {
            radio.checked = false;
        });
        
        this.updateConvertButton();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .close-error {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    }
    
    .close-error:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DocumentConverter();
});
