const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON body in POST requests
app.use(express.json());

// Serve static files (e.g., HTML, CSS, JavaScript) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get all products
app.get('/api/products', (req, res) => {
  fs.readFile(path.join(__dirname, 'products.json'), 'utf-8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read products data' });
    } else {
      res.json(JSON.parse(data));  // Send products data as JSON
    }
  });
});

// Endpoint to get a single product by ID
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  fs.readFile(path.join(__dirname, 'products.json'), 'utf-8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read products data' });
    } else {
      const products = JSON.parse(data);
      const product = products.find(p => p.id === productId);
      if (product) {
        res.json(product);  // Send the product data as JSON
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    }
  });
});

// Endpoint to add a new product
app.post('/api/products', (req, res) => {
  const newProduct = req.body;  // Get the new product data from the request body

  // Read the current products from the JSON file
  fs.readFile(path.join(__dirname, 'products.json'), 'utf-8', (err, data) => {
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
      fs.writeFile(path.join(__dirname, 'products.json'), JSON.stringify(products, null, 2), (err) => {
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
