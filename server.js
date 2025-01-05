const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware to parse JSON body in POST requests
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/images', express.static(path.join(__dirname, 'assets/images')));  // Serve image directory

// Ensure 'temp' and 'assets/images' directories exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const imagesDir = path.join(__dirname, 'assets/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Set up multer for handling file uploads
const upload = multer({
  dest: tempDir, // Temporary storage
});

// Handle image upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'assets/images', req.file.originalname);

  // Move the file to the assets/images directory
  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      console.error('Failed to save image:', err);
      return res.status(500).json({ error: 'Failed to save image' });
    }

    console.log('Image uploaded successfully:', targetPath);
    res.json({ filePath: `/assets/images/${req.file.originalname}` });
  });
});

// Endpoint to get all products
app.get('/api/products', (req, res) => {
  const productsFilePath = path.join(__dirname, 'products.json');
  if (!fs.existsSync(productsFilePath)) {
    fs.writeFileSync(productsFilePath, JSON.stringify([])); // Create an empty array if the file doesn't exist
  }

  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read products data' });
    } else {
      res.json(JSON.parse(data));  // Send products data as JSON
    }
  });
});

// Validation function for new product
function validateProduct(product) {
  const { name, price, rating, image } = product;
  if (!name || typeof name !== 'string') return 'Invalid product name';
  if (!price || typeof price !== 'number' || price <= 0) return 'Invalid product price';
  if (!rating || typeof rating !== 'number' || rating < 0 || rating > 5) return 'Invalid product rating';
  return null;
}

// Endpoint to add a new product
app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  const error = validateProduct(newProduct);
  if (error) {
    return res.status(400).json({ error });
  }

  const productsFilePath = path.join(__dirname, 'products.json');
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read products data' });
    } else {
      const products = JSON.parse(data);

      // Generate a new ID for the new product
      const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const addedProduct = { id: newId, ...newProduct };

      // Add the new product to the list
      products.push(addedProduct);

      // Write the updated products array to the JSON file
      fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
        if (err) {
          res.status(500).json({ error: 'Failed to save product' });
        } else {
          res.json(addedProduct);  // Return the added product data as JSON
        }
      });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
