# AutoTrain AI - No-Code Custom Model Training Software

![AutoTrain AI](https://img.shields.io/badge/version-1.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## 🎯 Overview

**AutoTrain AI** is a user-friendly desktop application that allows anyone to train custom AI image generation models **without writing any code**. Simply upload your images, add labels, and click train!

This software uses **LoRA (Low-Rank Adaptation)** technology to efficiently fine-tune Stable Diffusion models on your custom datasets, creating small, portable model files that can be shared and reused.

## ✨ Features

### 🚀 Easy Training
- **Drag & Drop Interface**: Simply select a folder with your training images
- **Automatic Preprocessing**: Images are automatically resized and formatted
- **No Coding Required**: Everything works through a visual interface
- **Real-time Progress**: Watch training progress with detailed logs

### 🎨 Image Generation
- **Text-to-Image**: Generate images from text prompts using your trained models
- **Custom Models**: Use your trained LoRA models or load existing ones
- **Advanced Controls**: Adjust guidance scale, steps, and more
- **Save Results**: Export generated images in PNG or JPEG format

### 📚 Model Management
- **Model Library**: Browse and manage all your trained models
- **Load/Export**: Load old models or export them to share with others
- **Model Information**: View metadata including training date, trigger words, etc.

### ⚙️ Flexible Settings
- **Multiple Base Models**: Choose from SD 1.5, SD 2.1, or SDXL
- **GPU Acceleration**: Automatic CUDA detection and usage
- **Customizable Parameters**: Adjust training steps, learning rate, image size
- **Persistent Config**: Save your preferred settings

## 📋 Requirements

### Hardware
- **Minimum**: 8GB RAM, CPU-only support
- **Recommended**: 16GB+ RAM, NVIDIA GPU with 8GB+ VRAM
- **Storage**: 10GB+ free space for models and training data

### Software
- Python 3.8 or higher
- Tkinter (usually included with Python)
- NVIDIA drivers (if using GPU)

## 🛠️ Installation

### Step 1: Clone or Download
```bash
cd /workspace
```

### Step 2: Create Virtual Environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Application
```bash
python autotrain_ai.py
```

## 📖 How to Use

### Training Your First Model

1. **Launch the Application**
   ```bash
   python autotrain_ai.py
   ```

2. **Upload Images**
   - Click "📁 Select Image Folder" in the Train tab
   - Choose a folder containing your training images (JPG, PNG, WebP, BMP)
   - Preview your images in the preview panel
   - Recommended: 10-50 high-quality images for best results

3. **Label Your Images**
   - Enter a unique **Trigger Word** (e.g., "myart", "customface")
   - Set a **Description Template** (e.g., "a photo of {trigger}")
   - This teaches the AI what your images represent

4. **Configure Training**
   - **Training Steps**: 500-2000 (more steps = better quality but slower)
   - **Learning Rate**: Start with 1e-4
   - **Image Size**: 512 (standard), 768, or 1024 (higher quality)

5. **Start Training**
   - Click "🚀 Start Training"
   - Watch the progress bar and logs
   - Training time varies (5-30 minutes typically)

6. **Save & Export**
   - Model automatically saves to `./models/` directory
   - Appears in the Model Library tab
   - Can be exported or used immediately

### Generating Images

1. **Go to Generate Tab**
2. **Select Your Model** from the dropdown
3. **Enter a Prompt** (include your trigger word!)
   - Example: "a beautiful {myart} style landscape at sunset"
4. **Adjust Settings** (optional)
   - Number of images
   - Guidance scale (creativity vs. prompt adherence)
   - Inference steps
5. **Click Generate** and wait for results
6. **Save** your favorite images

### Managing Models

- **View Library**: See all trained models with metadata
- **Load Model**: Import external LoRA files
- **Use Model**: Activate a model for generation
- **Export Model**: Copy model to another location
- **Delete Model**: Remove unwanted models

## 📁 Project Structure

```
/workspace/
├── autotrain_ai.py      # Main application
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── models/             # Trained models directory
│   ├── lora_custom_20240101_120000/
│   │   ├── pytorch_lora_weights.safetensors
│   │   └── metadata.json
│   └── config.json
└── config.json         # Application settings
```

## 🎓 Tips for Best Results

### Training Data
- **Quality over Quantity**: 15-30 high-quality images work better than 100 poor ones
- **Consistency**: Keep lighting, angles, and style consistent
- **Variety**: Include different poses, expressions, or perspectives
- **Resolution**: Use images at least 512x512 pixels
- **Format**: JPG or PNG preferred

### Trigger Words
- **Unique**: Use uncommon words or combinations
- **Short**: 1-2 words work best
- **Descriptive**: Make it related to your content
- Examples: `myartstyle`, `cyberpunk2099`, `fantasyportrait`

### Training Parameters
- **Beginner**: 1000 steps, 1e-4 learning rate, 512 size
- **Advanced**: 2000-3000 steps, 5e-5 learning rate, 768 size
- **Fine Details**: Higher steps + lower learning rate

## 🔧 Troubleshooting

### Common Issues

**"Missing required package" error**
```bash
pip install -r requirements.txt
```

**"No GPU detected" warning**
- This is normal if you don't have an NVIDIA GPU
- Training will work on CPU but will be slower

**Out of Memory errors**
- Reduce batch size in settings
- Use smaller image sizes (512 instead of 768/1024)
- Close other applications

**Training seems stuck**
- Check the log window for details
- Large models may take time to download initially
- Ensure you have enough disk space

**Generated images don't match training**
- Increase training steps
- Make sure to use trigger word in prompts
- Check that training images are high quality

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Stable Diffusion** by Stability AI
- **Diffusers** library by Hugging Face
- **LoRA** technique by Microsoft Research
- **PEFT** library by Hugging Face
- All open-source contributors

## 📞 Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ for the AI community**

*Empowering everyone to create custom AI models without coding!*
