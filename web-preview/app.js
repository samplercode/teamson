// Main application logic for WebTrain AI

class WebTrainApp {
    constructor() {
        this.currentTab = 'train';
        this.trainingImages = [];
        this.trainer = new ModelTrainer();
        this.generator = new ImageGenerator();
        this.db = new utils.IndexedDBStore();
        this.settings = {};
        
        this.init();
    }

    async init() {
        // Load settings
        await this.loadSettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check system capabilities
        this.checkSystemStatus();
        
        // Load models from library
        await this.loadLibrary();
        
        console.log('WebTrain AI initialized');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // File upload - Image drop zone
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

            // Drag and drop
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                this.handleFileDrop(e);
            });
        }

        // Data file drop zone (for CSV/Parquet)
        const dataDropZone = document.getElementById('data-drop-zone');
        const dataFileInput = document.getElementById('data-file-input');

        if (dataDropZone && dataFileInput) {
            dataDropZone.addEventListener('click', () => dataFileInput.click());
            dataFileInput.addEventListener('change', (e) => this.handleDataFileSelect(e));

            dataDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dataDropZone.classList.add('dragover');
            });

            dataDropZone.addEventListener('dragleave', () => {
                dataDropZone.classList.remove('dragover');
            });

            dataDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dataDropZone.classList.remove('dragover');
                this.handleDataFileDrop(e);
            });
        }

        // Training controls
        document.getElementById('startTrainBtn').addEventListener('click', () => this.startTraining());
        document.getElementById('cancelTrainBtn').addEventListener('click', () => this.cancelTraining());

        // Training parameters
        document.getElementById('trainingSteps').addEventListener('input', (e) => {
            document.getElementById('stepsValue').textContent = e.target.value;
        });

        document.getElementById('guidance').addEventListener('input', (e) => {
            document.getElementById('guidanceValue').textContent = e.target.value;
        });

        document.getElementById('inferSteps').addEventListener('input', (e) => {
            document.getElementById('inferStepsValue').textContent = e.target.value;
        });

        // Generate controls
        document.getElementById('generateBtn').addEventListener('click', () => this.generateImage());
        document.getElementById('clearGenerateBtn').addEventListener('click', () => this.clearGallery());

        // Library controls
        document.getElementById('importModelBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importModel(e));
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllModels());

        // Settings controls
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());

        // Modal controls
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('modelModal').addEventListener('click', (e) => {
            if (e.target.id === 'modelModal') this.closeModal();
        });
        document.getElementById('downloadModelBtn').addEventListener('click', () => this.downloadCurrentModel());
        document.getElementById('deleteModelBtn').addEventListener('click', () => this.deleteCurrentModel());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;
    }

    /**
     * Handle file selection
     */
    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        await this.addTrainingImages(files);
    }

    /**
     * Handle file drop
     */
    async handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        await this.addTrainingImages(files);
    }

    /**
     * Add training images and data files
     */
    async addTrainingImages(files) {
        const validation = this.trainer.validateImages(files);
        
        // Check if we have data files (CSV, JSON, Parquet)
        const dataFiles = files.filter(f => 
            f.name.endsWith('.csv') || f.name.endsWith('.json') || f.name.endsWith('.parquet')
        );
        
        const imageFiles = files.filter(f => 
            !f.name.endsWith('.csv') && !f.name.endsWith('.json') && !f.name.endsWith('.parquet')
        );
        
        // Process data files first
        for (const dataFile of dataFiles) {
            try {
                let imageData = [];
                
                if (dataFile.name.endsWith('.csv')) {
                    imageData = await this.trainer.parseCSV(dataFile);
                } else if (dataFile.name.endsWith('.json')) {
                    imageData = await this.trainer.parseJSON(dataFile);
                } else if (dataFile.name.endsWith('.parquet')) {
                    imageData = await this.trainer.parseParquet(dataFile);
                }
                
                // Show loading indicator
                utils.showToast(`Processing ${imageData.length} entries from ${dataFile.name}...`, 'success');
                
                // Add each entry from the data file
                let loadedCount = 0;
                for (const item of imageData) {
                    // Process image source (could be URL, base64, or path)
                    const processedImage = await this.trainer.processImageSource(item.path, item.label);
                    
                    if (processedImage) {
                        this.trainingImages.push({
                            id: utils.generateId(),
                            file: null,
                            preview: processedImage.preview,
                            imageUrl: processedImage.url,
                            name: item.path.split('/').pop() || item.path,
                            label: processedImage.label || item.label,
                            dataSource: dataFile.name,
                            sourceType: item.source,
                            isEmbedded: processedImage.isEmbedded,
                            status: processedImage.preview ? 'loaded' : 'reference'
                        });
                        loadedCount++;
                    }
                }
                
                utils.showToast(`Loaded ${loadedCount}/${imageData.length} entries from ${dataFile.name}`, loadedCount > 0 ? 'success' : 'warning');
            } catch (error) {
                console.error('Error processing data file:', error);
                utils.showToast(`Failed to process ${dataFile.name}: ${error.message}`, 'error');
            }
        }
        
        // Validate and process image files
        if (imageFiles.length > 0) {
            const imageValidation = this.trainer.validateImages(imageFiles);
            
            if (!imageValidation.isValid && this.trainingImages.length + imageValidation.valid.length < 5) {
                utils.showToast('Please upload at least 5 valid images', 'error');
            }

            imageValidation.errors.forEach(error => {
                utils.showToast(error, 'warning');
            });

            for (const file of imageValidation.valid) {
                try {
                    const resizedBlob = await utils.resizeImage(file);
                    const base64 = await utils.fileToBase64(resizedBlob);
                    
                    // Extract image name without extension as the label
                    const imageName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    
                    this.trainingImages.push({
                        id: utils.generateId(),
                        file: file,
                        preview: base64,
                        name: file.name,
                        label: imageName,
                        isEmbedded: true,
                        status: 'loaded'
                    });
                } catch (error) {
                    console.error('Error processing image:', error);
                    utils.showToast(`Failed to process ${file.name}`, 'error');
                }
            }
        }

        this.updateImagePreview();
    }

    /**
     * Update image preview with cleaner UI
     */
    updateImagePreview() {
        const previewContainer = document.getElementById('imagePreview');
        const imageCount = document.getElementById('imageCount');
        const uploadStatus = document.getElementById('uploadStatus');

        imageCount.textContent = this.trainingImages.length;
        uploadStatus.textContent = this.trainingImages.length >= 5 ? 'Ready' : 'Need more images';
        uploadStatus.style.color = this.trainingImages.length >= 5 ? '#10b981' : '#f59e0b';

        previewContainer.innerHTML = '';

        this.trainingImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            
            // Determine display based on image status
            const hasPreview = img.preview && img.preview.startsWith('data:image');
            const isReference = !hasPreview && img.imageUrl;
            const isLoading = img.status === 'loading';
            
            if (hasPreview) {
                // Embedded image (direct upload or successfully fetched URL)
                item.innerHTML = `
                    <div class="preview-image-wrapper">
                        <img src="${img.preview}" alt="${img.name}" loading="lazy">
                        ${!img.isEmbedded ? '<span class="badge badge-remote">Remote</span>' : ''}
                    </div>
                    <div class="preview-info">
                        <span class="label" title="${img.label || ''}">${img.label || 'Untitled'}</span>
                        <span class="source-badge">${img.dataSource ? 'CSV/JSON' : 'Upload'}</span>
                    </div>
                    <button class="remove-btn" onclick="app.removeImage(${index})" title="Remove">×</button>
                `;
            } else if (isReference) {
                // Reference to external image (couldn't fetch, showing as link)
                item.innerHTML = `
                    <div class="data-preview">
                        <div class="image-placeholder">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                        </div>
                        <div class="preview-info">
                            <span class="name" title="${img.name}">${img.name}</span>
                            <span class="label">${img.label || 'No caption'}</span>
                            <span class="status-badge status-reference">External Link</span>
                        </div>
                    </div>
                    <button class="remove-btn" onclick="app.removeImage(${index})" title="Remove">×</button>
                `;
            } else {
                // Unknown state or loading
                item.innerHTML = `
                    <div class="data-preview">
                        <div class="image-placeholder">
                            ${isLoading ? '<div class="spinner"></div>' : '<span>📊</span>'}
                        </div>
                        <div class="preview-info">
                            <span class="name">${img.name}</span>
                            <span class="label">${img.label || 'Processing...'}</span>
                        </div>
                    </div>
                    <button class="remove-btn" onclick="app.removeImage(${index})" title="Remove">×</button>
                `;
            }
            
            previewContainer.appendChild(item);
        });
    }

    /**
     * Remove image from training set
     */
    removeImage(index) {
        this.trainingImages.splice(index, 1);
        this.updateImagePreview();
    }

    /**
     * Start training
     */
    async startTraining() {
        const triggerWord = document.getElementById('triggerWord').value.trim();
        const steps = parseInt(document.getElementById('trainingSteps').value);
        const learningRate = document.getElementById('learningRate').value;
        const batchSize = parseInt(document.getElementById('batchSize').value);

        if (!triggerWord) {
            utils.showToast('Please enter a trigger word', 'error');
            return;
        }

        if (this.trainingImages.length < 5) {
            utils.showToast('Please upload at least 5 images', 'error');
            return;
        }

        // Show progress section
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('startTrainBtn').disabled = true;
        document.getElementById('cancelTrainBtn').disabled = false;

        // Setup trainer callbacks
        this.trainer.onProgress = (progress) => {
            document.getElementById('progressFill').style.width = `${progress.percent}%`;
            document.getElementById('progressText').textContent = progress.status;
            document.getElementById('progressPercent').textContent = `${progress.percent.toFixed(1)}%`;
            
            if (progress.losses) {
                utils.drawLossChart('lossChart', progress.losses);
            }
        };

        this.trainer.onComplete = async (result) => {
            utils.showToast('Training completed successfully!', 'success');
            
            // Save model to library
            await this.db.saveModel(result.model);
            await this.loadLibrary();
            
            // Reset UI
            document.getElementById('startTrainBtn').disabled = false;
            document.getElementById('cancelTrainBtn').disabled = true;
            
            // Switch to library tab
            setTimeout(() => this.switchTab('library'), 1000);
        };

        this.trainer.onError = (error) => {
            utils.showToast(`Training error: ${error.message}`, 'error');
            document.getElementById('startTrainBtn').disabled = false;
            document.getElementById('cancelTrainBtn').disabled = true;
        };

        // Start training
        try {
            await this.trainer.train(this.trainingImages, triggerWord, {
                steps,
                learningRate,
                batchSize,
                previewImage: this.trainingImages[0]?.preview
            });
        } catch (error) {
            console.error('Training failed:', error);
        }
    }

    /**
     * Cancel training
     */
    cancelTraining() {
        this.trainer.cancel();
        utils.showToast('Training cancelled', 'warning');
        document.getElementById('startTrainBtn').disabled = false;
        document.getElementById('cancelTrainBtn').disabled = true;
    }

    /**
     * Generate image
     */
    async generateImage() {
        const prompt = document.getElementById('prompt').value.trim();
        const model = document.getElementById('modelSelect').value;
        const guidance = parseFloat(document.getElementById('guidance').value);
        const steps = parseInt(document.getElementById('inferSteps').value);
        const seed = parseInt(document.getElementById('seed').value);

        if (!prompt) {
            utils.showToast('Please enter a prompt', 'error');
            return;
        }

        try {
            const result = await this.generator.generate(prompt, {
                model,
                guidance,
                steps,
                seed
            });

            this.addGeneratedImage(result);
            utils.showToast('Image generated!', 'success');
        } catch (error) {
            utils.showToast(`Generation error: ${error.message}`, 'error');
        }
    }

    /**
     * Add generated image to gallery
     */
    addGeneratedImage(result) {
        const gallery = document.getElementById('generatedGallery');
        
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${result.image}" alt="Generated image">
            <div class="actions">
                <button class="btn-primary" onclick="app.downloadImage('${result.image}')">Download</button>
            </div>
        `;
        
        gallery.insertBefore(item, gallery.firstChild);
    }

    /**
     * Download image
     */
    downloadImage(imageDataUrl) {
        this.generator.downloadImage(imageDataUrl);
    }

    /**
     * Clear gallery
     */
    clearGallery() {
        document.getElementById('generatedGallery').innerHTML = '';
    }

    /**
     * Load library
     */
    async loadLibrary() {
        const models = await this.db.getAllModels();
        const libraryGrid = document.getElementById('libraryGrid');
        const emptyLibrary = document.getElementById('emptyLibrary');
        const modelSelect = document.getElementById('modelSelect');

        libraryGrid.innerHTML = '';

        if (models.length === 0) {
            libraryGrid.appendChild(emptyLibrary);
            emptyLibrary.style.display = 'block';
            return;
        }

        emptyLibrary.style.display = 'none';

        // Update model select dropdown
        modelSelect.innerHTML = '<option value="base">Base Model (No LoRA)</option>';

        models.forEach(model => {
            // Add to library grid
            const card = document.createElement('div');
            card.className = 'model-card';
            card.onclick = () => this.showModelDetails(model.id);
            card.innerHTML = `
                <h3>${model.triggerWord}</h3>
                <p>Steps: ${model.trainingSteps}</p>
                <p>Loss: ${model.finalLoss?.toFixed(4) || 'N/A'}</p>
                <p>Size: ${utils.formatFileSize(model.fileSize)}</p>
                <p style="font-size: 0.8rem; color: #64748b;">${utils.formatDate(model.createdAt)}</p>
            `;
            libraryGrid.appendChild(card);

            // Add to dropdown
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.triggerWord;
            modelSelect.appendChild(option);
        });
    }

    /**
     * Show model details modal
     */
    async showModelDetails(modelId) {
        const model = await this.db.getModel(modelId);
        if (!model) return;

        this.currentModelId = modelId;

        document.getElementById('modalTitle').textContent = `Model: ${model.triggerWord}`;
        document.getElementById('modalBody').innerHTML = `
            <p><strong>Trigger Word:</strong> ${model.triggerWord}</p>
            <p><strong>Created:</strong> ${utils.formatDate(model.createdAt)}</p>
            <p><strong>Training Steps:</strong> ${model.trainingSteps}</p>
            <p><strong>Final Loss:</strong> ${model.finalLoss?.toFixed(4) || 'N/A'}</p>
            <p><strong>File Size:</strong> ${utils.formatFileSize(model.fileSize)}</p>
            <p><strong>Learning Rate:</strong> ${model.config?.learningRate || 'N/A'}</p>
            <p><strong>Batch Size:</strong> ${model.config?.batchSize || 'N/A'}</p>
        `;

        document.getElementById('modelModal').classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modelModal').classList.remove('active');
        this.currentModelId = null;
    }

    /**
     * Download current model
     */
    async downloadCurrentModel() {
        if (!this.currentModelId) return;

        const model = await this.db.getModel(this.currentModelId);
        if (!model) return;

        const format = this.settings.outputFormat || 'safetensors';
        const filename = `${model.triggerWord}_lora.${format}`;
        
        utils.downloadBlob(model.blob, filename);
        utils.showToast('Model downloaded!', 'success');
        this.closeModal();
    }

    /**
     * Delete current model
     */
    async deleteCurrentModel() {
        if (!this.currentModelId) return;

        if (confirm('Are you sure you want to delete this model?')) {
            await this.db.deleteModel(this.currentModelId);
            await this.loadLibrary();
            utils.showToast('Model deleted', 'success');
            this.closeModal();
        }
    }

    /**
     * Import model
     */
    async importModel(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await file.text();
            const modelData = JSON.parse(content);

            // Validate model format
            if (!modelData.metadata || !modelData.weights) {
                throw new Error('Invalid model file format');
            }

            const model = {
                id: utils.generateId(),
                name: modelData.metadata.triggerWord + '_lora',
                triggerWord: modelData.metadata.triggerWord,
                createdAt: modelData.metadata.trainedAt,
                trainingSteps: modelData.metadata.trainingSteps,
                finalLoss: modelData.metadata.finalLoss,
                fileSize: file.size,
                blob: file,
                config: {
                    learningRate: modelData.metadata.learningRate,
                    batchSize: modelData.metadata.batchSize
                }
            };

            await this.db.saveModel(model);
            await this.loadLibrary();
            utils.showToast('Model imported successfully!', 'success');
        } catch (error) {
            utils.showToast('Failed to import model: ' + error.message, 'error');
        }

        event.target.value = '';
    }

    /**
     * Clear all models
     */
    async clearAllModels() {
        if (confirm('Are you sure you want to delete all models? This cannot be undone.')) {
            await this.db.clearAllModels();
            await this.loadLibrary();
            utils.showToast('All models cleared', 'warning');
        }
    }

    /**
     * Load settings
     */
    async loadSettings() {
        this.settings = {
            outputFormat: await this.db.getSetting('outputFormat', 'safetensors'),
            precision: await this.db.getSetting('precision', 'fp32'),
            useGPU: await this.db.getSetting('useGPU', 'auto'),
            maxImages: await this.db.getSetting('maxImages', 50)
        };

        // Apply settings to UI
        document.getElementById('outputFormat').value = this.settings.outputFormat;
        document.getElementById('precision').value = this.settings.precision;
        document.getElementById('useGPU').value = this.settings.useGPU;
        document.getElementById('maxImages').value = this.settings.maxImages;
    }

    /**
     * Save settings
     */
    async saveSettings() {
        this.settings = {
            outputFormat: document.getElementById('outputFormat').value,
            precision: document.getElementById('precision').value,
            useGPU: document.getElementById('useGPU').value,
            maxImages: parseInt(document.getElementById('maxImages').value)
        };

        await Promise.all([
            this.db.saveSetting('outputFormat', this.settings.outputFormat),
            this.db.saveSetting('precision', this.settings.precision),
            this.db.saveSetting('useGPU', this.settings.useGPU),
            this.db.saveSetting('maxImages', this.settings.maxImages)
        ]);

        utils.showToast('Settings saved!', 'success');
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        if (confirm('This will delete all models and settings. Are you sure?')) {
            await this.db.clearAllModels();
            await this.loadLibrary();
            utils.showToast('All data cleared', 'warning');
        }
    }

    /**
     * Check system status
     */
    checkSystemStatus() {
        const statusEl = document.getElementById('systemStatus');
        
        const webgl = utils.checkWebGLSupport();
        const wasm = utils.checkWasmSupport();

        if (webgl && wasm) {
            statusEl.textContent = 'Ready (WebGL + WASM)';
            statusEl.className = 'ready';
        } else if (webgl || wasm) {
            statusEl.textContent = 'Ready (Limited)';
            statusEl.className = 'loading';
        } else {
            statusEl.textContent = 'Limited Support';
            statusEl.className = 'error';
        }
    }
}

// Initialize app
const app = new WebTrainApp();
