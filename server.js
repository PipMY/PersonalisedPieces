const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const stripe = require("stripe")('sk_test_51QdtFwRuJ1XrmYECPnWcFE5pryjFJaOpCmTIEwYSs2d6xlA1NVXq18DIUZTik4sGHcb3PddUJ5HRtIRHjtYFTEmS00EI0weuxC');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON body in POST requests with increased payload size limit (To upload high res photos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
      description: "API documentation for my Express backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
  },
  apis: ["server.js"],
};

const swaggerDocs = process.env.NODE_ENV === 'test' ? {} : swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const calculateOrderAmount = (items) => {
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  let total = 0;
  items.forEach((item) => {
    total += Math.round(item.amount * 100); // Ensure amount is in cents and rounded to an integer
  });
  return total;
};

const products = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('reviews.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "gbp",
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
  const targetPath = path.join(__dirname, 'public/assets/images', req.file.originalname);

  // Move the file to the public/assets/images directory
  fs.rename(tempPath, targetPath, (err) => {
    if (err) {
      console.error('Failed to save image:', err);
      return res.status(500).json({ error: 'Failed to save image' });
    }

    console.log('Image uploaded successfully:', targetPath);
    res.json({ filePath: `/assets/images/${req.file.originalname}` });
  });
});


// Get endpoint for a single product (for when you are adding to the basket) returns 404 if it cannot be found
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).send('Product not found');
  }
});

// Validation function for new product
function validateProduct(product) {
  const { name, price, rating, images } = product;
  if (!name || typeof name !== 'string') return 'Invalid product name';
  if (!price || typeof price !== 'number' || price <= 0) return 'Invalid product price';
  if (!rating || typeof rating !== 'number' || rating < 0 || rating > 5) return 'Invalid product rating';
  if (!images || !Array.isArray(images) || images.some(img => typeof img !== 'string')) return 'Invalid product images';
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
      const addedProduct = { id: newId, ...newProduct, images: newProduct.images || [] };

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

    products[productIndex] = { id: productId, ...updatedProduct, images: updatedProduct.images || [] };

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

// Endpoint to get reviews for a product
app.get('/api/products/:id/reviews', (req, res) => {
  const productId = parseInt(req.params.id);
  const productReviews = reviews.find(review => review.productId === productId);
  if (productReviews) {
    res.json(productReviews.reviews);
  } else {
    res.json([]); // Return an empty array if no reviews are found
  }
});

// Endpoint to get all reviews
app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});

// Endpoint to add a review to a product
app.post('/api/products/:id/reviews', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  if (product) {
    const review = { ...req.body, productId: product.id };
    const productReviews = reviews.find(r => r.productId === productId);
    if (productReviews) {
      productReviews.reviews.push(review);
    } else {
      reviews.push({ productId: product.id, reviews: [review] });
    }
    fs.writeFileSync('reviews.json', JSON.stringify(reviews, null, 2));

    // Update product rating based on the average of all reviews
    const updatedReviews = reviews.find(r => r.productId === productId).reviews;
    const averageRating = calculateAverageRating(updatedReviews);
    product.rating = averageRating;
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));

    res.status(201).json(review);
  } else {
    res.status(404).send('Product not found');
  }
});

function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get reviews for a product
 *     description: Retrieves all reviews for a specific product by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the product whose reviews are to be retrieved.
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rating:
 *                     type: integer
 *                     example: 5
 *                   comment:
 *                     type: string
 *                     example: "Great product!"
 *       404:
 *         description: Reviews not found for the given product ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Reviews not found"
 */

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add a review to a product
 *     description: Allows users to add a review for a specific product.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the product to review.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Amazing quality!"
 *     responses:
 *       201:
 *         description: Review successfully added.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: integer
 *                   example: 1
 *                 rating:
 *                   type: integer
 *                   example: 5
 *                 comment:
 *                   type: string
 *                   example: "Amazing quality!"
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 */
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
 *     description: Creates a new product and adds it to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Product"
 *               price:
 *                 type: number
 *                 example: 19.99
 *               rating:
 *                 type: number
 *                 example: 4.2
 *     responses:
 *       200:
 *         description: Successfully added the product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "New Product"
 *                 price:
 *                   type: number
 *                   example: 19.99
 *                 rating:
 *                   type: number
 *                   example: 4.2
 *       400:
 *         description: Invalid input data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid product data"
 *       500:
 *         description: Server error while saving product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to save product"
 */

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     description: Updates the details of an existing product.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Product Name"
 *               price:
 *                 type: number
 *                 example: 24.99
 *               rating:
 *                 type: number
 *                 example: 4.7
 *     responses:
 *       200:
 *         description: Successfully updated the product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Updated Product Name"
 *                 price:
 *                   type: number
 *                   example: 24.99
 *                 rating:
 *                   type: number
 *                   example: 4.7
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Server error while updating product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update product"
 */

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     description: Removes a product from the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique ID of the product
 *     responses:
 *       200:
 *         description: Successfully deleted the product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product deleted"
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Server error while deleting product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete product"
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload an image
 *     description: Allows users to upload an image, which is then stored on the server.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       200:
 *         description: Successfully uploaded the image.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filePath:
 *                   type: string
 *                   example: "/assets/images/example.jpg"
 *       400:
 *         description: No file uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file uploaded"
 *       500:
 *         description: Server error while saving the image.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to save image"
 */