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
            const modelData = await this.generateModelData(triggerWord, config);

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
    async generateModelData(triggerWord, config) {
        const modelId = utils.generateId();
        const timestamp = new Date().toISOString();
        
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
                finalLoss: this.losses[this.losses.length - 1]
            },
            // Simulated weight data (placeholder)
            weights: {
                type: 'mock',
                size: Math.floor(Math.random() * 50000000) + 10000000,
                checksum: utils.generateId()
            }
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
            config: config
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
        const validFiles = [];
        const errors = [];

        for (const file of files) {
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
}

// Export trainer
window.ModelTrainer = ModelTrainer;
