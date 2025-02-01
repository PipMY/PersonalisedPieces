const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const stripe = require("stripe")('sk_test_51QdtFwRuJ1XrmYECPnWcFE5pryjFJaOpCmTIEwYSs2d6xlA1NVXq18DIUZTik4sGHcb3PddUJ5HRtIRHjtYFTEmS00EI0weuxC');

const app = express();
const port = 3000;

// Middleware to parse JSON body in POST requests
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const calculateOrderAmount = (items) => {
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  let total = 0;
  items.forEach((item) => {
    total += Math.round(item.amount * 100); // Ensure amount is in cents and rounded to an integer
  });
  return total;
};

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "gbp",
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.use('/assets/images', express.static(path.join(__dirname, 'assets/images')));  // Serve image directory

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the admin HTML file
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the checkout HTML file
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Serve the product HTML file
app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  const configPath = path.join(__dirname, "auth_config.json");
  if (fs.existsSync(configPath)) {
    res.sendFile(configPath);
  } else {
    res.status(404).json({ error: 'Configuration file not found' });
  }
});

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
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Allows for the image to be uploaded and saved to the server
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

// Endpoint to get all products (for the store page)
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

// Get endpoint for a single product (for when you are adding to the basket) returns 404 if it cannot be found
app.get('/api/products/:id', (req, res) => {
  const productsFilePath = path.join(__dirname, 'products.json');
  if (!fs.existsSync(productsFilePath)) {
    return res.status(404).json({ error: 'Products file not found' });
  }

  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read products data' });
    }

    const products = JSON.parse(data);
    const productId = parseInt(req.params.id, 10);
    const product = products.find(p => p.id === productId);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
});

// Validation function for new product
function validateProduct(product) {
  const { name, price, rating, image } = product;
  if (!name || typeof name !== 'string') return 'Invalid product name';
  if (!price || typeof price !== 'number' || price <= 0) return 'Invalid product price';
  if (!rating || typeof rating !== 'number' || rating < 0 || rating > 5) return 'Invalid product rating';
  if (!image || typeof image !== 'string') return 'Invalid product image';
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

// Endpoint to update a product
app.put('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const updatedProduct = req.body;

  const productsFilePath = path.join(__dirname, 'products.json');
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read products data' });
    }

    const products = JSON.parse(data);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[productIndex] = { id: productId, ...updatedProduct };

    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update product' });
      }
      res.json(products[productIndex]);
    });
  });
});

// Endpoint to delete a product
app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);

  const productsFilePath = path.join(__dirname, 'products.json');
  fs.readFile(productsFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read products data' });
    }

    let products = JSON.parse(data);
    products = products.filter(p => p.id !== productId);

    fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete product' });
      }
      res.json({ message: 'Product deleted' });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});