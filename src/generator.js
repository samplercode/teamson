// Generator module for WebTrain AI
// Implements browser-based image generation

class ImageGenerator {
    constructor() {
        this.isGenerating = false;
        this.currentModel = null;
    }

    /**
     * Generate image from prompt
     */
    async generate(prompt, config = {}) {
        if (!prompt || prompt.trim() === '') {
            throw new Error('Prompt is required');
        }

        if (this.isGenerating) {
            throw new Error('Generation already in progress');
        }

        this.isGenerating = true;

        try {
            const model = config.model || 'base';
            const guidance = config.guidance || 7.5;
            const steps = config.steps || 50;
            const seed = config.seed === -1 ? Math.floor(Math.random() * 1000000) : config.seed;
            const width = config.width || 512;
            const height = config.height || 512;

            // Simulate generation process
            await this.sleep(100);

            // In a real implementation, this would use TensorFlow.js or ONNX
            // For now, we create a placeholder generated image
            const imageData = await this.createPlaceholderImage(prompt, width, height, seed);

            return {
                success: true,
                image: imageData,
                prompt: prompt,
                model: model,
                config: {
                    guidance,
                    steps,
                    seed,
                    width,
                    height
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Create placeholder generated image (simulated)
     */
    async createPlaceholderImage(prompt, width, height, seed) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Use seed to generate deterministic colors
        const random = this.seededRandom(seed);
        
        // Create gradient background based on prompt
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        
        // Extract color hints from prompt (simple simulation)
        const colors = this.extractColorHints(prompt);
        const color1 = colors[0] || this.randomColor(random);
        const color2 = colors[1] || this.randomColor(random);
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add artistic patterns
        for (let i = 0; i < 20; i++) {
            const x = random() * width;
            const y = random() * height;
            const radius = random() * 100 + 20;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.floor(random() * 255)}, ${Math.floor(random() * 255)}, ${Math.floor(random() * 255)}, 0.1)`;
            ctx.fill();
        }

        // Add text overlay with prompt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text
        const words = prompt.split(' ');
        let line = '';
        let lines = [];
        const maxWidth = width - 40;
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                lines.push(line);
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        const lineHeight = 30;
        const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
        
        lines.forEach((l, index) => {
            ctx.fillText(l.trim(), width / 2, startY + index * lineHeight);
        });

        // Add watermark
        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'right';
        ctx.fillText('WebTrain AI', width - 10, height - 10);

        return canvas.toDataURL('image/png');
    }

    /**
     * Extract color hints from prompt
     */
    extractColorHints(prompt) {
        const colorMap = {
            'red': '#ef4444',
            'blue': '#3b82f6',
            'green': '#10b981',
            'yellow': '#f59e0b',
            'purple': '#8b5cf6',
            'orange': '#f97316',
            'pink': '#ec4899',
            'black': '#1e293b',
            'white': '#f8fafc',
            'sunset': ['#f97316', '#ec4899'],
            'ocean': ['#3b82f6', '#06b6d4'],
            'forest': ['#10b981', '#059669'],
            'fire': ['#ef4444', '#f97316'],
            'sky': ['#3b82f6', '#93c5fd']
        };

        const lowerPrompt = prompt.toLowerCase();
        const foundColors = [];

        for (const [keyword, color] of Object.entries(colorMap)) {
            if (lowerPrompt.includes(keyword)) {
                if (Array.isArray(color)) {
                    foundColors.push(...color);
                } else {
                    foundColors.push(color);
                }
                if (foundColors.length >= 2) break;
            }
        }

        return foundColors;
    }

    /**
     * Generate random color
     */
    randomColor(random) {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#3b82f6'];
        return colors[Math.floor(random() * colors.length)];
    }

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    }

    /**
     * Load model for generation
     */
    async loadModel(modelData) {
        this.currentModel = modelData;
        return { success: true };
    }

    /**
     * Cancel generation
     */
    cancel() {
        this.isGenerating = false;
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Download generated image
     */
    downloadImage(imageDataUrl, filename) {
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = filename || `generated_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Generate batch images
     */
    async generateBatch(prompt, count, config) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const result = await this.generate(prompt, {
                    ...config,
                    seed: config.seed === -1 ? -1 : config.seed + i
                });
                results.push(result);
            } catch (error) {
                console.error(`Failed to generate image ${i + 1}:`, error);
            }
        }
        
        return results;
    }
}

// Export generator
window.ImageGenerator = ImageGenerator;
