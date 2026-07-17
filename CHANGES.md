# WebTrain AI - Image Labeling & Data File Support Update

## Summary of Changes

This update addresses the issue where generated images didn't include proper labeling information about what/whose image was being trained. The system now:

1. **Extracts image names as labels** - When uploading images, the filename (without extension) is automatically used as the training label
2. **Supports data files from Hugging Face** - CSV, JSON, and Parquet file formats are now supported for importing training datasets
3. **Stores label metadata in models** - Training metadata now includes all image labels that the model learned from

## Files Modified

### 1. `app.js`
- **`addTrainingImages()`**: Now extracts filename without extension as label for each image
- **`handleFileSelect()` & `handleFileDrop()`**: Made async to support data file parsing
- **`updateImagePreview()`**: Enhanced to show labels for images and display data file entries with source information
- Added support for processing CSV, JSON, and Parquet files alongside regular images

### 2. `trainer.js`
- **`train()`**: Now processes image labels and passes them to model generation
- **`generateModelData()`**: Updated to accept and store labeled training data in model metadata
  - Model files now include `imageLabels` array
  - Model files now include `trainingData` with label associations
  - Model files now include `numTrainingImages` count
- **`validateImages()`**: Extended to accept CSV, JSON, and Parquet files
- **`parseCSV()`**: New method to parse CSV files with columns: image_path, label/caption/text
- **`parseParquet()`**: New method to parse Parquet files (or JSON exports from Hugging Face)
- **`parseJSON()`**: New method to parse JSON files in various Hugging Face dataset formats

### 3. `styles.css`
- Added styles for `.data-preview` to display data file entries in the training preview
- Added styles for `.preview-info` to show labels on image previews
- Added styles for `.data-icon`, `.name`, `.label`, and `.source` elements

## How It Works

### For Image Files:
1. User uploads images like `john_doe.png`, `jane_smith.jpg`
2. System extracts "john_doe" and "jane_smith" as labels
3. These labels are stored with each training image
4. During training, the model learns the association between images and their labels
5. Generated model includes all labels in metadata

### For Data Files (CSV/JSON/Parquet):
1. User uploads a dataset file from Hugging Face or similar
2. System parses the file to extract image paths and captions/labels
3. Each entry is added to the training set with its associated label
4. Training proceeds with the labeled dataset
5. Model metadata includes source information and all labels

## Example CSV Format:
```csv
image_path,label,caption
images/person1.jpg,john_doe,A photo of John Doe
images/person2.jpg,jane_smith,Jane Smith portrait
```

## Example JSON Format:
```json
[
  {"image_path": "images/001.jpg", "label": "person1", "caption": "A person"},
  {"image_path": "images/002.jpg", "label": "person2", "caption": "Another person"}
]
```

## Benefits:
- Models now know what each training image represents
- Generated images can be better associated with specific subjects
- Easy import of existing datasets from Hugging Face
- Better organization and tracking of training data
