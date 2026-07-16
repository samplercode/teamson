# WebTrain AI - Browser-Based No-Code Model Trainer

## Overview
**WebTrain AI** is a completely client-side, privacy-focused web application that allows users to train custom AI image generation models directly in their browser. No login required, no server uploads, no installations.

## Key Features

### 🔒 Privacy First
- **100% Client-Side**: All processing happens in your browser using WebAssembly and TensorFlow.js
- **No Login Required**: Just open the website and start training
- **No Data Upload**: Your images never leave your computer
- **Temporary Session**: Data is automatically cleared when you close the tab

### 🎨 Professional Features
- Drag-and-drop image upload
- Automatic image preprocessing (resize, crop, normalize)
- Real-time training visualization
- Custom trigger word configuration
- Model export/download functionality
- Load previously saved models
- Text-to-image generation with custom models

### 🚀 Technology Stack
- **Frontend**: Pure HTML5, CSS3, Modern JavaScript (ES6+)
- **AI Engine**: TensorFlow.js + ONNX Runtime Web
- **Image Processing**: Canvas API + WebGL acceleration
- **Storage**: IndexedDB for temporary session storage
- **Model Format**: LoRA-compatible weights for easy export

## Project Structure

```
web-preview/
├── index.html          # Main application interface
├── styles.css          # Modern responsive styling
├── app.js              # Core application logic
├── trainer.js          # Training pipeline implementation
├── generator.js        # Image generation module
├── utils.js            # Helper functions
├── manifest.json       # PWA configuration
└── README.md           # This file
```

## How It Works

### 1. Open the Website
Simply navigate to the hosted URL or open `index.html` locally. No installation needed.

### 2. Upload Training Images
- Drag and drop your image folder
- Supported formats: JPG, PNG, WEBP
- Minimum 5 images recommended for good results

### 3. Configure Training
- Enter a unique trigger word (e.g., "myartstyle")
- Adjust training parameters (steps, learning rate)
- Preview preprocessed images

### 4. Train Model
- Click "Start Training"
- Watch real-time progress and loss graphs
- Training runs entirely in your browser

### 5. Generate & Export
- Test your model with text prompts
- Download the trained model file (.safetensors or .pt)
- Save to your local machine or discard

## Browser Requirements

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Edge 90+
- ✅ Firefox 88+ (with WebAssembly support)
- ⚠️ Safari 14+ (limited WebAssembly features)

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **GPU**: WebGL 2.0 support (optional but recommended)
- **Storage**: Temporary browser storage (cleared on close)

## Running Locally

### Option 1: Direct File Open
```bash
# Simply open in your browser
open web-preview/index.html
```

### Option 2: Local Server (Recommended)
```bash
# Using Python
cd web-preview
python -m http.server 8000

# Using Node.js
npx serve web-preview
```

Then navigate to `http://localhost:8000`

## Deployment Options

### Static Hosting (Free)
Deploy to any static hosting service:
- **Netlify**: Drag and drop the `web-preview` folder
- **Vercel**: Connect GitHub repo or drag & drop
- **GitHub Pages**: Push to gh-pages branch
- **Cloudflare Pages**: Direct deployment

### Self-Hosting
```bash
# Using Nginx
sudo cp -r web-preview /var/www/html/webtrain
sudo systemctl restart nginx

# Access at: http://your-server/webtrain
```

## Security Considerations

### What Stays Local
- ✅ All uploaded images
- ✅ Training data and intermediate files
- ✅ Generated model weights
- ✅ Generated images

### What Gets Cleared on Close
- 🗑️ IndexedDB temporary storage
- 🗑️ In-memory model weights
- 🗑️ Canvas buffers
- 🗑️ Session history

### User Control
- Manual save required to keep models
- Clear button to wipe all data immediately
- No cookies or tracking scripts
- No external API calls

## Limitations

### Browser-Based Constraints
- Training speed depends on user's hardware
- Large datasets (>100 images) may cause memory issues
- Complex models require more powerful GPUs
- Some mobile devices may have limited support

### Compared to Desktop Version
| Feature | Desktop App | Web Version |
|---------|-------------|-------------|
| Training Speed | Fast (native) | Moderate (browser) |
| Max Dataset Size | Unlimited | ~50 images recommended |
| Persistence | Permanent | Session-only |
| Installation | Required | None |
| Privacy | High | Maximum |
| Accessibility | OS-specific | Any browser |

## Future Enhancements

### Planned Features
- [ ] WebGPU support for faster training
- [ ] Collaborative training sessions (WebRTC)
- [ ] Model sharing marketplace (opt-in)
- [ ] Advanced preprocessing filters
- [ ] Batch generation mode
- [ ] Style mixing between models
- [ ] Mobile-optimized interface

### Technical Improvements
- [ ] WASM optimization for faster inference
- [ ] Progressive Web App (PWA) offline support
- [ ] Service worker caching
- [ ] WebAssembly threads for parallel processing

## Contributing

This is an open-source project. Contributions welcome!

### Development Setup
```bash
git clone <repository-url>
cd web-preview
# Start development server
npm install -g live-server
live-server --port=8080
```

### Code Structure
- `trainer.js`: Core training loop with LoRA implementation
- `generator.js`: Diffusion model inference
- `utils.js`: Image preprocessing and utilities
- `app.js`: UI event handlers and state management

## License

MIT License - Free to use, modify, and distribute.

## Support

For issues and feature requests, please open a GitHub issue.

---

**Note**: This web version complements the desktop application. Users who need maximum performance should use the desktop version, while those wanting quick, private, no-install access should use the web version.
