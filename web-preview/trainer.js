// Trainer class with data file parsing capabilities
class ModelTrainer {
    constructor() {
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
        this.isTraining = false;
    }

    /**
     * Validate uploaded images
     */
    validateImages(files) {
        const valid = [];
        const errors = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        for (const file of files) {
            if (allowedTypes.includes(file.type)) {
                valid.push(file);
            } else {
                errors.push(`Invalid file type: ${file.name}`);
            }
        }
        
        return { isValid: valid.length > 0, valid, errors };
    }

    /**
     * Parse CSV file and extract image data
     */
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                        resolve([]);
                        return;
                    }
                    
                    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                    const imageData = [];
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = this.parseCSVLine(lines[i]);
                        if (values.length === headers.length) {
                            const entry = {};
                            headers.forEach((header, idx) => {
                                entry[header.toLowerCase()] = values[idx];
                            });
                            
                            // Handle different column names for image and label
                            const imageUrl = entry['image'] || entry['image_url'] || entry['path'] || entry['url'] || '';
                            const label = entry['caption'] || entry['text'] || entry['prompt'] || entry['label'] || '';
                            
                            if (imageUrl) {
                                imageData.push({
                                    path: imageUrl,
                                    label: label,
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
     * Parse a single CSV line handling quoted values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        return values;
    }

    /**
     * Parse JSON file and extract image data
     */
    async parseJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const imageData = [];
                    
                    // Handle array of objects
                    const items = Array.isArray(data) ? data : (data.data || data.images || []);
                    
                    for (const item of items) {
                        const imageUrl = item.image || item.image_url || item.path || item.url || '';
                        const label = item.caption || item.text || item.prompt || item.label || '';
                        
                        if (imageUrl) {
                            imageData.push({
                                path: imageUrl,
                                label: label,
                                source: 'json'
                            });
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
     * Parse Parquet file (simplified - expects WASM module)
     */
    async parseParquet(file) {
        // For browser-based parquet parsing, we'll use a simple approach
        // In production, you'd use a library like parquet-wasm
        console.warn('Parquet parsing requires parquet-wasm module. Treating as binary.');
        
        // Try to read as text first (for small test files)
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Attempt to parse if it's actually a text-based format
                    const text = e.target.result;
                    if (text.startsWith('{') || text.startsWith('[')) {
                        // It's JSON
                        return this.parseJSON(file).then(resolve).catch(reject);
                    }
                    // Otherwise return empty - proper parquet needs WASM
                    resolve([]);
                } catch (error) {
                    resolve([]); // Return empty for binary parquet
                }
            };
            reader.onerror = () => resolve([]);
            reader.readAsText(file);
        });
    }

    /**
     * Process image from various sources (URL, base64, blob)
     */
    async processImageSource(imageSrc, label = '') {
        try {
            // Check if it's a base64 encoded image
            if (imageSrc.startsWith('data:image')) {
                return {
                    preview: imageSrc,
                    label: label,
                    isEmbedded: true
                };
            }
            
            // Check if it's a URL
            if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
                // Try to fetch and convert to base64
                try {
                    const response = await fetch(imageSrc, { mode: 'cors' });
                    const blob = await response.blob();
                    const base64 = await utils.fileToBase64(blob);
                    return {
                        preview: base64,
                        label: label,
                        isEmbedded: false
                    };
                } catch (fetchError) {
                    // CORS error or network issue - store as URL reference
                    return {
                        preview: null,
                        label: label,
                        url: imageSrc,
                        isEmbedded: false
                    };
                }
            }
            
            // Local path or relative URL - store as reference
            return {
                preview: null,
                label: label,
                url: imageSrc,
                isEmbedded: false
            };
        } catch (error) {
            console.error('Error processing image source:', error);
            return null;
        }
    }

    /**
     * Train model (stub implementation)
     */
    async train(images, triggerWord, options) {
        this.isTraining = true;
        const steps = options.steps || 100;
        
        for (let i = 0; i < steps && this.isTraining; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (this.onProgress) {
                this.onProgress({
                    percent: ((i + 1) / steps) * 100,
                    status: `Training step ${i + 1}/${steps}`,
                    losses: Array.from({ length: i + 1 }, (_, j) => Math.exp(-j * 0.1) * (0.5 + Math.random() * 0.1))
                });
            }
        }
        
        if (this.isTraining && this.onComplete) {
            this.onComplete({
                model: {
                    id: utils.generateId(),
                    name: triggerWord,
                    created: new Date().toISOString(),
                    weights: new Float32Array(100)
                }
            });
        }
        
        this.isTraining = false;
    }

    /**
     * Cancel training
     */
    cancel() {
        this.isTraining = false;
    }
}

class ImageGenerator {
    constructor() {}

    async generate(prompt, options) {
        // Stub implementation - returns placeholder
        return {
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmOGZhZmMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HZW5lcmF0ZWQ8L3RleHQ+PC9zdmc+'
        };
    }

    downloadImage(imageDataUrl) {
        const link = document.createElement('a');
        link.download = `generated-${Date.now()}.png`;
        link.href = imageDataUrl;
        link.click();
    }
}
