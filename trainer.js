// Trainer module for WebTrain AI
// Implements browser-based LoRA training simulation

class ModelTrainer {
    constructor() {
        this.isTraining = false;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.losses = [];
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    /**
     * Start training process
     */
    async train(images, triggerWord, config) {
        if (this.isTraining) {
            throw new Error('Training already in progress');
        }

        if (!images || images.length === 0) {
            throw new Error('No training images provided');
        }

        if (!triggerWord || triggerWord.trim() === '') {
            throw new Error('Trigger word is required');
        }

        this.isTraining = true;
        this.currentStep = 0;
        this.totalSteps = config.steps || 500;
        this.losses = [];

        try {
            // Initialize training
            if (this.onProgress) {
                this.onProgress({
                    step: 0,
                    total: this.totalSteps,
                    percent: 0,
                    loss: 0,
                    status: 'Initializing model...'
                });
            }

            // Simulate training process with progressive loss reduction
            const learningRate = parseFloat(config.learningRate) || 0.0005;
            const batchSize = config.batchSize || 2;
            
            // Initial loss (simulated)
            let currentLoss = 1.0 + Math.random() * 0.5;

            for (let step = 1; step <= this.totalSteps; step++) {
                if (!this.isTraining) {
                    throw new Error('Training cancelled by user');
                }

                this.currentStep = step;

                // Simulate loss calculation with gradual decrease
                const decay = Math.exp(-learningRate * step * 0.1);
                const noise = (Math.random() - 0.5) * 0.1;
                currentLoss = Math.max(0.01, currentLoss * decay + noise);
                
                this.losses.push(currentLoss);

                // Report progress every 10 steps or at completion
                if (step % 10 === 0 || step === this.totalSteps) {
                    const percent = ((step / this.totalSteps) * 100).toFixed(1);
                    
                    if (this.onProgress) {
                        this.onProgress({
                            step: step,
                            total: this.totalSteps,
                            percent: parseFloat(percent),
                            loss: currentLoss,
                            losses: [...this.losses],
                            status: `Training step ${step}/${this.totalSteps}`
                        });
                    }

                    // Allow UI to update
                    await this.sleep(50);
                }

                // Simulate training time per step
                await this.sleep(100);
            }

            // Training complete
            const modelData = await this.generateModelData(triggerWord, config, labeledData);

            if (this.onComplete) {
                this.onComplete({
                    model: modelData,
                    finalLoss: currentLoss,
                    totalSteps: this.totalSteps,
                    losses: this.losses
                });
            }

            return modelData;

        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        } finally {
            this.isTraining = false;
        }
    }

    /**
     * Cancel ongoing training
     */
    cancel() {
        this.isTraining = false;
    }

    /**
     * Generate mock model data for export
     */
    async generateModelData(triggerWord, config, labeledData = []) {
        const modelId = utils.generateId();
        const timestamp = new Date().toISOString();
        
        // Extract image labels for training metadata
        const imageLabels = labeledData.map(item => item.label).filter(l => l);
        
        // Create a simulated model file (in real implementation, this would be actual weights)
        const modelContent = {
            metadata: {
                format: 'lora',
                version: '1.0',
                triggerWord: triggerWord,
                baseModel: 'stable-diffusion-v1.5',
                trainingSteps: this.totalSteps,
                learningRate: config.learningRate,
                batchSize: config.batchSize,
                trainedAt: timestamp,
                finalLoss: this.losses[this.losses.length - 1],
                // Add image labels that the model learned from
                imageLabels: imageLabels,
                numTrainingImages: labeledData.length
            },
            // Simulated weight data (placeholder)
            weights: {
                type: 'mock',
                size: Math.floor(Math.random() * 50000000) + 10000000,
                checksum: utils.generateId()
            },
            // Store training data associations
            trainingData: labeledData.map((item, idx) => ({
                index: idx,
                label: item.label,
                imageName: item.image.name || `image_${idx}`
            }))
        };

        // Create blob for download
        const blob = new Blob([JSON.stringify(modelContent, null, 2)], {
            type: 'application/json'
        });

        return {
            id: modelId,
            name: `${triggerWord}_lora`,
            triggerWord: triggerWord,
            createdAt: timestamp,
            trainingSteps: this.totalSteps,
            finalLoss: this.losses[this.losses.length - 1],
            fileSize: blob.size,
            blob: blob,
            preview: config.previewImage || null,
            config: config,
            imageLabels: imageLabels  // Include labels in returned model
        };
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Load existing model
     */
    async loadModel(modelData) {
        // In real implementation, this would load actual weights
        return {
            success: true,
            model: modelData
        };
    }

    /**
     * Validate training images
     */
    validateImages(files) {
        const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
        const validDataFormats = ['text/csv', 'application/vnd.apache.parquet', 'application/json'];
        const validFiles = [];
        const errors = [];

        for (const file of files) {
            // Check if it's a data file (CSV, parquet, JSON)
            if (validDataFormats.includes(file.type) || 
                file.name.endsWith('.csv') || 
                file.name.endsWith('.parquet') || 
                file.name.endsWith('.json')) {
                validFiles.push(file);
                continue;
            }
            
            // Check if it's an image file
            if (!validFormats.includes(file.type)) {
                errors.push(`Invalid format: ${file.name}`);
                continue;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                errors.push(`File too large: ${file.name}`);
                continue;
            }

            validFiles.push(file);
        }

        return {
            valid: validFiles,
            errors: errors,
            isValid: validFiles.length >= 5
        };
    }

    /**
     * Parse CSV file for training data
     */
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    
                    const imageData = [];
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                        if (values.length === headers.length) {
                            const row = {};
                            headers.forEach((header, idx) => {
                                row[header] = values[idx];
                            });
                            
                            // Expect columns: image_path, label/caption
                            if (row.image_path || row.image) {
                                imageData.push({
                                    path: row.image_path || row.image,
                                    label: row.label || row.caption || row.text || '',
                                    source: 'csv'
                                });
                            }
                        }
                    }
                    
                    resolve(imageData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Parse Parquet file (simplified - expects JSON-like structure)
     * Note: Full parquet parsing would require a library like parquetjs
     */
    async parseParquet(file) {
        // For browser-based implementation, we'll handle parquet files
        // that are exported as JSON from Hugging Face datasets
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let data;
                    
                    // Try to parse as JSON (for HF datasets exported as JSON)
                    try {
                        data = JSON.parse(content);
                    } catch (parseError) {
                        // If not JSON, treat as binary parquet placeholder
                        // In production, you'd use a parquet parser library
                        console.warn('Binary parquet detected - using metadata only');
                        data = [{
                            path: file.name,
                            label: 'parquet_dataset',
                            source: 'parquet'
                        }];
                    }
                    
                    const imageData = [];
                    if (Array.isArray(data)) {
                        data.forEach((item, idx) => {
                            imageData.push({
                                path: item.image_path || item.image || item.path || `item_${idx}`,
                                label: item.label || item.caption || item.text || item.prompt || '',
                                source: 'parquet'
                            });
                        });
                    } else if (data.data && Array.isArray(data.data)) {
                        data.data.forEach((item, idx) => {
                            imageData.push({
                                path: item.image_path || item.image || item.path || `item_${idx}`,
                                label: item.label || item.caption || item.text || item.prompt || '',
                                source: 'parquet'
                            });
                        });
                    }
                    
                    resolve(imageData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Parse JSON file for training data (Hugging Face format)
     */
    async parseJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const imageData = [];
                    
                    // Handle different JSON formats
                    if (Array.isArray(data)) {
                        data.forEach((item, idx) => {
                            imageData.push({
                                path: item.image_path || item.image || item.path || item.file_name || `item_${idx}`,
                                label: item.label || item.caption || item.text || item.prompt || '',
                                source: 'json'
                            });
                        });
                    } else if (data.data && Array.isArray(data.data)) {
                        data.data.forEach((item, idx) => {
                            imageData.push({
                                path: item.image_path || item.image || item.path || `item_${idx}`,
                                label: item.label || item.caption || item.text || item.prompt || '',
                                source: 'json'
                            });
                        });
                    } else if (data.examples && Array.isArray(data.examples)) {
                        data.examples.forEach((item, idx) => {
                            imageData.push({
                                path: item.image_path || item.image || `item_${idx}`,
                                label: item.label || item.caption || item.text || '',
                                source: 'json'
                            });
                        });
                    }
                    
                    resolve(imageData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

// Export trainer
window.ModelTrainer = ModelTrainer;
