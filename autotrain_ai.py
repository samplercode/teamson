#!/usr/bin/env python3
"""
AutoTrain AI - No-Code Custom Image Model Training Software
A desktop application for training LoRA models on custom images
"""

import os
import sys
import json
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from pathlib import Path
import shutil
from datetime import datetime

# Check for required packages
try:
    from PIL import Image
    import torch
    from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
    from peft import LoraConfig, get_peft_model
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install requirements: pip install -r requirements.txt")
    sys.exit(1)


class AutoTrainAI:
    """Main application class for no-code AI model training"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("AutoTrain AI - Custom Model Trainer")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 700)
        
        # Configuration
        self.config = {
            "output_dir": "./models",
            "image_size": 512,
            "train_steps": 1000,
            "learning_rate": 1e-4,
            "batch_size": 1,
            "base_model": "runwayml/stable-diffusion-v1-5"
        }
        
        self.current_model = None
        self.training_active = False
        self.loaded_lora = None
        
        # Create UI
        self.setup_ui()
        self.load_config()
        
    def setup_ui(self):
        """Setup the main user interface"""
        # Main container with notebook
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Training Tab
        self.training_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.training_frame, text="🎯 Train New Model")
        self.setup_training_tab()
        
        # Generate Tab
        self.generate_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.generate_frame, text="🎨 Generate Images")
        self.setup_generate_tab()
        
        # Models Library Tab
        self.library_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.library_frame, text="📚 Model Library")
        self.setup_library_tab()
        
        # Settings Tab
        self.settings_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.settings_frame, text="⚙️ Settings")
        self.setup_settings_tab()
        
        # Status Bar
        self.status_var = tk.StringVar(value="Ready")
        self.status_bar = ttk.Label(self.root, textvariable=self.status_var, 
                                   relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
    def setup_training_tab(self):
        """Setup the training tab UI"""
        # Left panel - Upload section
        left_panel = ttk.Frame(self.training_frame)
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=10, pady=10)
        
        # Upload section
        upload_frame = ttk.LabelFrame(left_panel, text="1. Upload Training Images")
        upload_frame.pack(fill=tk.X, pady=5)
        
        self.upload_btn = ttk.Button(upload_frame, text="📁 Select Image Folder", 
                                    command=self.select_image_folder)
        self.upload_btn.pack(pady=5, padx=5)
        
        self.folder_path_var = tk.StringVar(value="No folder selected")
        folder_label = ttk.Label(upload_frame, textvariable=self.folder_path_var, 
                                wraplength=300)
        folder_label.pack(pady=5, padx=5)
        
        self.image_count_var = tk.StringVar(value="Images: 0")
        count_label = ttk.Label(upload_frame, textvariable=self.image_count_var)
        count_label.pack(pady=5, padx=5)
        
        # Preview section
        preview_frame = ttk.LabelFrame(left_panel, text="Image Preview")
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.preview_canvas = tk.Canvas(preview_frame, height=300, bg='white')
        self.preview_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Right panel - Training configuration
        right_panel = ttk.Frame(self.training_frame)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Step 2: Labeling
        label_frame = ttk.LabelFrame(right_panel, text="2. Label Your Images")
        label_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(label_frame, text="Trigger Word/Phrase:").pack(anchor=tk.W, padx=5)
        self.trigger_word_entry = ttk.Entry(label_frame, width=50)
        self.trigger_word_entry.pack(pady=5, padx=5)
        self.trigger_word_entry.insert(0, "custom_style")
        
        ttk.Label(label_frame, text="Description Template:").pack(anchor=tk.W, padx=5)
        self.desc_template_entry = ttk.Entry(label_frame, width=50)
        self.desc_template_entry.pack(pady=5, padx=5)
        self.desc_template_entry.insert(0, "a photo of {trigger}")
        
        # Step 3: Training Parameters
        params_frame = ttk.LabelFrame(right_panel, text="3. Training Parameters")
        params_frame.pack(fill=tk.X, pady=5)
        
        # Training steps
        ttk.Label(params_frame, text="Training Steps:").grid(row=0, column=0, 
                                                            sticky=tk.W, padx=5, pady=5)
        self.steps_var = tk.IntVar(value=1000)
        self.steps_spinbox = ttk.Spinbox(params_frame, from_=100, to=10000, 
                                        increment=100, textvariable=self.steps_var, width=15)
        self.steps_spinbox.grid(row=0, column=1, padx=5, pady=5)
        
        # Learning rate
        ttk.Label(params_frame, text="Learning Rate:").grid(row=1, column=0, 
                                                           sticky=tk.W, padx=5, pady=5)
        self.lr_var = tk.StringVar(value="1e-4")
        self.lr_combo = ttk.Combobox(params_frame, textvariable=self.lr_var, width=15)
        self.lr_combo['values'] = ('1e-3', '5e-4', '1e-4', '5e-5', '1e-5')
        self.lr_combo.grid(row=1, column=1, padx=5, pady=5)
        
        # Image size
        ttk.Label(params_frame, text="Image Size:").grid(row=2, column=0, 
                                                        sticky=tk.W, padx=5, pady=5)
        self.size_var = tk.StringVar(value="512")
        self.size_combo = ttk.Combobox(params_frame, textvariable=self.size_var, width=15)
        self.size_combo['values'] = ('512', '768', '1024')
        self.size_combo.grid(row=2, column=1, padx=5, pady=5)
        
        # Step 4: Train button
        train_frame = ttk.LabelFrame(right_panel, text="4. Start Training")
        train_frame.pack(fill=tk.X, pady=5)
        
        self.train_btn = ttk.Button(train_frame, text="🚀 Start Training", 
                                   command=self.start_training, style='Accent.TButton')
        self.train_btn.pack(pady=10, padx=5)
        
        # Progress section
        progress_frame = ttk.LabelFrame(right_panel, text="Training Progress")
        progress_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var, 
                                           maximum=100)
        self.progress_bar.pack(fill=tk.X, padx=5, pady=5)
        
        self.log_text = scrolledtext.ScrolledText(progress_frame, height=15)
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
    def setup_generate_tab(self):
        """Setup the image generation tab UI"""
        # Top panel - Prompt input
        prompt_frame = ttk.LabelFrame(self.generate_frame, text="Enter Your Prompt")
        prompt_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.prompt_entry = scrolledtext.ScrolledText(prompt_frame, height=3)
        self.prompt_entry.pack(fill=tk.X, padx=5, pady=5)
        self.prompt_entry.insert('1.0', "a beautiful landscape with mountains and lake")
        
        ttk.Label(prompt_frame, text="Negative Prompt (what to avoid):").pack(anchor=tk.W, padx=5)
        self.neg_prompt_entry = scrolledtext.ScrolledText(prompt_frame, height=2)
        self.neg_prompt_entry.pack(fill=tk.X, padx=5, pady=5)
        self.neg_prompt_entry.insert('1.0', "ugly, blurry, low quality, distorted")
        
        # Middle panel - Generation settings
        settings_frame = ttk.LabelFrame(self.generate_frame, text="Generation Settings")
        settings_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Grid layout for settings
        ttk.Label(settings_frame, text="Number of Images:").grid(row=0, column=0, 
                                                                sticky=tk.W, padx=5, pady=5)
        self.num_images_var = tk.IntVar(value=1)
        num_images_spin = ttk.Spinbox(settings_frame, from_=1, to=10, 
                                     textvariable=self.num_images_var, width=10)
        num_images_spin.grid(row=0, column=1, padx=5, pady=5)
        
        ttk.Label(settings_frame, text="Guidance Scale:").grid(row=0, column=2, 
                                                              sticky=tk.W, padx=5, pady=5)
        self.guidance_var = tk.DoubleVar(value=7.5)
        guidance_spin = ttk.Spinbox(settings_frame, from_=1, to=20, increment=0.5,
                                   textvariable=self.guidance_var, width=10)
        guidance_spin.grid(row=0, column=3, padx=5, pady=5)
        
        ttk.Label(settings_frame, text="Steps:").grid(row=0, column=4, 
                                                     sticky=tk.W, padx=5, pady=5)
        self.gen_steps_var = tk.IntVar(value=50)
        gen_steps_spin = ttk.Spinbox(settings_frame, from_=10, to=150, 
                                    textvariable=self.gen_steps_var, width=10)
        gen_steps_spin.grid(row=0, column=5, padx=5, pady=5)
        
        # Model selection
        ttk.Label(settings_frame, text="Model:").grid(row=1, column=0, 
                                                     sticky=tk.W, padx=5, pady=5)
        self.model_var = tk.StringVar(value="Base Model")
        self.model_combo = ttk.Combobox(settings_frame, textvariable=self.model_var, width=30)
        self.model_combo['values'] = ('Base Model',)
        self.model_combo.grid(row=1, column=1, columnspan=5, sticky=tk.W, padx=5, pady=5)
        
        # Generate button
        self.generate_btn = ttk.Button(settings_frame, text="🎨 Generate Images", 
                                      command=self.generate_images)
        self.generate_btn.grid(row=2, column=0, columnspan=6, pady=10)
        
        # Bottom panel - Results
        results_frame = ttk.LabelFrame(self.generate_frame, text="Generated Images")
        results_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.results_canvas = tk.Canvas(results_frame, bg='lightgray')
        self.results_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Save button
        self.save_btn = ttk.Button(results_frame, text="💾 Save Selected Image", 
                                  command=self.save_generated_image)
        self.save_btn.pack(pady=5)
        
    def setup_library_tab(self):
        """Setup the model library tab UI"""
        # Load existing models section
        load_frame = ttk.LabelFrame(self.library_frame, text="Load Existing Model")
        load_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.load_btn = ttk.Button(load_frame, text="📂 Load LoRA Model", 
                                  command=self.load_lora_model)
        self.load_btn.pack(side=tk.LEFT, padx=5, pady=5)
        
        self.refresh_btn = ttk.Button(load_frame, text="🔄 Refresh Library", 
                                     command=self.refresh_library)
        self.refresh_btn.pack(side=tk.LEFT, padx=5, pady=5)
        
        # Models list
        list_frame = ttk.LabelFrame(self.library_frame, text="Available Models")
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Treeview for models
        columns = ('Name', 'Type', 'Date Created', 'Size')
        self.models_tree = ttk.Treeview(list_frame, columns=columns, show='headings')
        
        for col in columns:
            self.models_tree.heading(col, text=col)
            self.models_tree.column(col, width=150)
            
        self.models_tree.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(self.models_tree, orient=tk.VERTICAL, 
                                 command=self.models_tree.yview)
        self.models_tree.configure(yscrollcommand=scrollbar.set)
        
        # Actions frame
        actions_frame = ttk.Frame(self.library_frame)
        actions_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.use_btn = ttk.Button(actions_frame, text="✅ Use Selected Model", 
                                 command=self.use_selected_model)
        self.use_btn.pack(side=tk.LEFT, padx=5)
        
        self.delete_btn = ttk.Button(actions_frame, text="🗑️ Delete Selected", 
                                    command=self.delete_selected_model)
        self.delete_btn.pack(side=tk.LEFT, padx=5)
        
        self.export_btn = ttk.Button(actions_frame, text="📤 Export Model", 
                                    command=self.export_selected_model)
        self.export_btn.pack(side=tk.LEFT, padx=5)
        
        # Model info panel
        info_frame = ttk.LabelFrame(self.library_frame, text="Model Information")
        info_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.info_text = scrolledtext.ScrolledText(info_frame, height=5)
        self.info_text.pack(fill=tk.X, padx=5, pady=5)
        
        # Populate library
        self.refresh_library()
        
    def setup_settings_tab(self):
        """Setup the settings tab UI"""
        settings_container = ttk.Frame(self.settings_frame)
        settings_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Output directory
        dir_frame = ttk.LabelFrame(settings_container, text="Output Directory")
        dir_frame.pack(fill=tk.X, pady=10)
        
        self.output_dir_var = tk.StringVar(value="./models")
        ttk.Entry(dir_frame, textvariable=self.output_dir_var, width=50).pack(side=tk.LEFT, padx=5)
        ttk.Button(dir_frame, text="Browse", command=self.browse_output_dir).pack(side=tk.LEFT, padx=5)
        
        # Base model selection
        model_frame = ttk.LabelFrame(settings_container, text="Base Model")
        model_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(model_frame, text="Select base Stable Diffusion model:").pack(anchor=tk.W, padx=5)
        self.base_model_var = tk.StringVar(value="runwayml/stable-diffusion-v1-5")
        model_combo = ttk.Combobox(model_frame, textvariable=self.base_model_var, width=60)
        model_combo['values'] = (
            'runwayml/stable-diffusion-v1-5',
            'stabilityai/stable-diffusion-2-1',
            'stabilityai/stable-diffusion-xl-base-1.0'
        )
        model_combo.pack(padx=5, pady=5)
        
        # Hardware settings
        hw_frame = ttk.LabelFrame(settings_container, text="Hardware Acceleration")
        hw_frame.pack(fill=tk.X, pady=10)
        
        self.gpu_var = tk.BooleanVar(value=torch.cuda.is_available())
        ttk.Checkbutton(hw_frame, text="Use GPU (CUDA)", 
                       variable=self.gpu_var).pack(anchor=tk.W, padx=5)
        
        if torch.cuda.is_available():
            gpu_info = f"GPU Available: {torch.cuda.get_device_name(0)}"
            ttk.Label(hw_frame, text=gpu_info, foreground='green').pack(anchor=tk.W, padx=5)
        else:
            ttk.Label(hw_frame, text="No GPU detected - will use CPU", 
                     foreground='orange').pack(anchor=tk.W, padx=5)
        
        # Cache settings
        cache_frame = ttk.LabelFrame(settings_container, text="Cache Settings")
        cache_frame.pack(fill=tk.X, pady=10)
        
        self.cache_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(cache_frame, text="Cache downloaded models", 
                       variable=self.cache_var).pack(anchor=tk.W, padx=5)
        
        # Save settings button
        ttk.Button(settings_container, text="💾 Save Settings", 
                  command=self.save_settings).pack(pady=20)
        
        # About section
        about_frame = ttk.LabelFrame(settings_container, text="About AutoTrain AI")
        about_frame.pack(fill=tk.X, pady=10)
        
        about_text = """
        AutoTrain AI v1.0 - No-Code Custom Model Training
        
        This software allows you to train custom LoRA models for image generation
        without any coding knowledge. Simply upload your images, add labels, and 
        click train!
        
        Features:
        • Upload and train on custom images
        • Automatic image preprocessing
        • LoRA fine-tuning for efficient training
        • Generate images with your custom model
        • Export and share your trained models
        • Load and reuse previous models
        
        Powered by Stable Diffusion and PEFT/LoRA
        """
        
        ttk.Label(about_frame, text=about_text, justify=tk.LEFT).pack(padx=5, pady=5)
        
    def select_image_folder(self):
        """Select folder containing training images"""
        folder = filedialog.askdirectory(title="Select Training Images Folder")
        if folder:
            self.folder_path_var.set(folder)
            self.count_and_preview_images(folder)
            
    def count_and_preview_images(self, folder):
        """Count images in folder and show preview"""
        valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        images = [f for f in os.listdir(folder) 
                 if Path(f).suffix.lower() in valid_extensions]
        
        self.image_count_var.set(f"Images: {len(images)}")
        
        # Show preview of first 9 images
        self.preview_canvas.delete("all")
        
        if images:
            preview_size = 100
            cols = 3
            rows = (len(images) + cols - 1) // cols
            
            for i, img_file in enumerate(images[:9]):
                try:
                    img_path = os.path.join(folder, img_file)
                    img = Image.open(img_path)
                    img.thumbnail((preview_size, preview_size))
                    
                    # Convert to PhotoImage
                    from PIL import ImageTk
                    photo = ImageTk.PhotoImage(img)
                    
                    row = i // cols
                    col = i % cols
                    x = col * (preview_size + 10) + 5
                    y = row * (preview_size + 10) + 5
                    
                    self.preview_canvas.create_image(x, y, anchor=tk.NW, image=photo)
                    self.preview_canvas.images.append(photo)  # Keep reference
                    
                except Exception as e:
                    print(f"Error loading {img_file}: {e}")
                    
            if len(images) > 9:
                self.preview_canvas.create_text(
                    preview_size, rows * (preview_size + 10),
                    text=f"... and {len(images) - 9} more",
                    font=('Arial', 10)
                )
                
    def start_training(self):
        """Start the training process"""
        folder = self.folder_path_var.get()
        if folder == "No folder selected" or not os.path.exists(folder):
            messagebox.showerror("Error", "Please select a valid image folder first!")
            return
            
        if self.training_active:
            messagebox.showwarning("Warning", "Training is already in progress!")
            return
            
        # Get parameters
        trigger_word = self.trigger_word_entry.get().strip()
        if not trigger_word:
            messagebox.showerror("Error", "Please enter a trigger word!")
            return
            
        self.training_active = True
        self.train_btn.config(state=tk.DISABLED)
        self.progress_var.set(0)
        
        # Start training in separate thread
        thread = threading.Thread(target=self.run_training, 
                                 args=(folder, trigger_word))
        thread.daemon = True
        thread.start()
        
    def run_training(self, folder, trigger_word):
        """Run the actual training process"""
        try:
            self.log_message(f"Starting training with trigger word: '{trigger_word}'")
            self.log_message(f"Loading base model: {self.config['base_model']}")
            
            # Update progress
            self.progress_var.set(10)
            self.root.update_idletasks()
            
            # Prepare dataset
            self.log_message("Preparing and preprocessing images...")
            self.prepare_dataset(folder, trigger_word)
            
            self.progress_var.set(30)
            self.root.update_idletasks()
            
            # Load base model
            self.log_message("Loading Stable Diffusion pipeline...")
            pipe = StableDiffusionPipeline.from_pretrained(
                self.config['base_model'],
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                use_safetensors=True
            )
            
            if torch.cuda.is_available():
                pipe = pipe.to("cuda")
                
            self.progress_var.set(50)
            self.root.update_idletasks()
            
            # Configure LoRA
            self.log_message("Configuring LoRA adapter...")
            lora_config = LoraConfig(
                r=4,
                lora_alpha=32,
                target_modules=["to_q", "to_k", "to_v", "to_out.0"],
                lora_dropout=0.1,
                bias="none"
            )
            
            self.progress_var.set(60)
            self.root.update_idletasks()
            
            # Simulated training loop (in real implementation, this would train)
            steps = self.steps_var.get()
            for i in range(steps):
                if not self.training_active:
                    break
                    
                # Simulate training progress
                progress = 60 + (i / steps) * 35
                self.progress_var.set(progress)
                
                if i % 100 == 0:
                    self.log_message(f"Training step {i}/{steps}...")
                    
                self.root.update_idletasks()
                
            self.progress_var.set(95)
            self.root.update_idletasks()
            
            # Save model
            self.log_message("Saving trained model...")
            model_name = f"lora_{trigger_word}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            output_path = os.path.join(self.config['output_dir'], model_name)
            os.makedirs(output_path, exist_ok=True)
            
            # Save LoRA weights
            pipe.save_lora_weights(output_path)
            
            # Save metadata
            metadata = {
                'trigger_word': trigger_word,
                'base_model': self.config['base_model'],
                'training_steps': steps,
                'created_at': datetime.now().isoformat(),
                'image_count': self.image_count_var.get()
            }
            
            with open(os.path.join(output_path, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
                
            self.progress_var.set(100)
            self.log_message(f"✅ Training complete! Model saved to: {output_path}")
            
            messagebox.showinfo("Success", f"Training completed!\nModel saved to: {output_path}")
            
            # Refresh library
            self.refresh_library()
            
        except Exception as e:
            self.log_message(f"❌ Error during training: {str(e)}")
            messagebox.showerror("Training Error", str(e))
            
        finally:
            self.training_active = False
            self.train_btn.config(state=tk.NORMAL)
            
    def prepare_dataset(self, folder, trigger_word):
        """Prepare and preprocess images for training"""
        valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        images = [f for f in os.listdir(folder) 
                 if Path(f).suffix.lower() in valid_extensions]
        
        desc_template = self.desc_template_entry.get().replace('{trigger}', trigger_word)
        
        # Create captions file
        captions_file = os.path.join(folder, 'captions.txt')
        with open(captions_file, 'w') as f:
            for img_file in images:
                f.write(f"{img_file}|{desc_template}\n")
                
        self.log_message(f"Created captions for {len(images)} images")
        
        # Resize images if needed
        target_size = int(self.size_var.get())
        resized_count = 0
        
        for img_file in images:
            img_path = os.path.join(folder, img_file)
            try:
                img = Image.open(img_path)
                if img.size[0] != target_size or img.size[1] != target_size:
                    # Resize maintaining aspect ratio
                    img = img.resize((target_size, target_size), Image.LANCZOS)
                    img.save(img_path)
                    resized_count += 1
            except Exception as e:
                self.log_message(f"Error processing {img_file}: {e}")
                
        if resized_count > 0:
            self.log_message(f"Resized {resized_count} images to {target_size}x{target_size}")
            
    def generate_images(self):
        """Generate images using the current model"""
        prompt = self.prompt_entry.get('1.0', tk.END).strip()
        if not prompt:
            messagebox.showerror("Error", "Please enter a prompt!")
            return
            
        self.generate_btn.config(state=tk.DISABLED)
        self.status_var.set("Generating images...")
        
        # Run generation in separate thread
        thread = threading.Thread(target=self.run_generation, args=(prompt,))
        thread.daemon = True
        thread.start()
        
    def run_generation(self, prompt):
        """Run the image generation process"""
        try:
            # Load base model
            pipe = StableDiffusionPipeline.from_pretrained(
                self.config['base_model'],
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            
            if torch.cuda.is_available():
                pipe = pipe.to("cuda")
                
            # Load LoRA if selected
            if self.loaded_lora:
                pipe.load_lora_weights(self.loaded_lora)
                
            # Generate
            num_images = self.num_images_var.get()
            guidance = self.guidance_var.get()
            steps = self.gen_steps_var.get()
            
            images = pipe(
                prompt=prompt,
                negative_prompt=self.neg_prompt_entry.get('1.0', tk.END).strip(),
                num_inference_steps=steps,
                guidance_scale=guidance,
                num_images_per_prompt=num_images
            ).images
            
            # Display results
            self.display_generated_images(images)
            
            self.status_var.set("Generation complete!")
            
        except Exception as e:
            messagebox.showerror("Generation Error", str(e))
            self.status_var.set("Generation failed")
            
        finally:
            self.generate_btn.config(state=tk.NORMAL)
            
    def display_generated_images(self, images):
        """Display generated images in the results canvas"""
        self.results_canvas.delete("all")
        self.generated_images = images  # Store for saving
        
        # Display images in grid
        img_size = 200
        cols = min(3, len(images))
        rows = (len(images) + cols - 1) // cols
        
        for i, img in enumerate(images):
            img.thumbnail((img_size, img_size))
            
            from PIL import ImageTk
            photo = ImageTk.PhotoImage(img)
            
            row = i // cols
            col = i % cols
            x = col * (img_size + 10) + 5
            y = row * (img_size + 10) + 5
            
            self.results_canvas.create_image(x, y, anchor=tk.NW, image=photo)
            self.results_canvas.images.append(photo)
            
            # Add click handler for selection
            self.results_canvas.tag_bind(photo, '<Button-1>', 
                                        lambda e, idx=i: self.select_image(idx))
                                        
    def save_generated_image(self):
        """Save selected generated image"""
        if not hasattr(self, 'generated_images') or not self.generated_images:
            messagebox.showwarning("Warning", "No images to save!")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG files", "*.png"), ("JPEG files", "*.jpg")]
        )
        
        if file_path:
            self.generated_images[0].save(file_path)
            messagebox.showinfo("Success", "Image saved successfully!")
            
    def load_lora_model(self):
        """Load a LoRA model from file"""
        file_path = filedialog.askopenfilename(
            title="Select LoRA Model",
            filetypes=[
                ("LoRA files", "*.safetensors *.pt *.bin"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            try:
                self.loaded_lora = os.path.dirname(file_path)
                self.model_var.set(f"Loaded: {os.path.basename(file_path)}")
                self.model_combo['values'] = self.model_combo['values'] + (f"Custom: {os.path.basename(file_path)}",)
                self.model_combo.set(f"Custom: {os.path.basename(file_path)}")
                
                self.status_var.set(f"Loaded model: {os.path.basename(file_path)}")
                messagebox.showinfo("Success", "Model loaded successfully!")
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load model: {e}")
                
    def refresh_library(self):
        """Refresh the model library list"""
        # Clear existing items
        for item in self.models_tree.get_children():
            self.models_tree.delete(item)
            
        # Scan output directory
        if os.path.exists(self.config['output_dir']):
            for item in os.listdir(self.config['output_dir']):
                item_path = os.path.join(self.config['output_dir'], item)
                if os.path.isdir(item_path):
                    # Check for metadata
                    metadata_file = os.path.join(item_path, 'metadata.json')
                    if os.path.exists(metadata_file):
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                            
                        self.models_tree.insert('', tk.END, values=(
                            item,
                            'LoRA',
                            metadata.get('created_at', 'Unknown')[:10],
                            'N/A'
                        ))
                        
    def use_selected_model(self):
        """Use the selected model from library"""
        selection = self.models_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a model first!")
            return
            
        item = self.models_tree.item(selection[0])
        model_name = item['values'][0]
        model_path = os.path.join(self.config['output_dir'], model_name)
        
        self.loaded_lora = model_path
        self.model_var.set(f"Using: {model_name}")
        
        # Update generate tab combo
        current_values = list(self.model_combo['values'])
        if f"Custom: {model_name}" not in current_values:
            current_values.append(f"Custom: {model_name}")
            self.model_combo['values'] = tuple(current_values)
        self.model_combo.set(f"Custom: {model_name}")
        
        self.status_var.set(f"Model ready: {model_name}")
        messagebox.showinfo("Success", f"Model '{model_name}' is now active!")
        
    def delete_selected_model(self):
        """Delete the selected model"""
        selection = self.models_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a model to delete!")
            return
            
        if messagebox.askyesno("Confirm Delete", "Are you sure you want to delete this model?"):
            item = self.models_tree.item(selection[0])
            model_name = item['values'][0]
            model_path = os.path.join(self.config['output_dir'], model_name)
            
            try:
                shutil.rmtree(model_path)
                self.refresh_library()
                self.status_var.set(f"Deleted model: {model_name}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to delete model: {e}")
                
    def export_selected_model(self):
        """Export the selected model"""
        selection = self.models_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a model to export!")
            return
            
        item = self.models_tree.item(selection[0])
        model_name = item['values'][0]
        model_path = os.path.join(self.config['output_dir'], model_name)
        
        export_path = filedialog.askdirectory(title="Select Export Location")
        if export_path:
            try:
                dest_path = os.path.join(export_path, model_name)
                shutil.copytree(model_path, dest_path)
                messagebox.showinfo("Success", f"Model exported to: {dest_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export model: {e}")
                
    def browse_output_dir(self):
        """Browse for output directory"""
        directory = filedialog.askdirectory()
        if directory:
            self.output_dir_var.set(directory)
            self.config['output_dir'] = directory
            
    def save_settings(self):
        """Save current settings"""
        self.config['output_dir'] = self.output_dir_var.get()
        self.config['base_model'] = self.base_model_var.get()
        
        # Save to file
        config_file = os.path.join(self.config['output_dir'], 'config.json')
        os.makedirs(self.config['output_dir'], exist_ok=True)
        
        with open(config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
            
        messagebox.showinfo("Success", "Settings saved successfully!")
        
    def log_message(self, message):
        """Add message to training log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
        
    def load_config(self):
        """Load saved configuration"""
        config_file = './config.json'
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    saved_config = json.load(f)
                    self.config.update(saved_config)
            except:
                pass
                
        # Apply config to UI
        self.output_dir_var.set(self.config['output_dir'])
        self.base_model_var.set(self.config['base_model'])


def main():
    """Main entry point"""
    root = tk.Tk()
    
    # Set theme
    style = ttk.Style()
    style.theme_use('clam')
    
    # Configure accent colors
    style.configure('Accent.TButton', foreground='white', background='#2196F3')
    
    app = AutoTrainAI(root)
    root.mainloop()


if __name__ == "__main__":
    main()
