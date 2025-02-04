process.env.NODE_ENV = 'test';

const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = require('../server');

jest.mock('fs');

describe('API Endpoints', () => {
  beforeAll(() => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 10.0, rating: 4.5, images: [] },
      { id: 2, name: 'Product 2', price: 20.0, rating: 4.0, images: [] },
    ];
    const mockReviews = [
      { productId: 1, reviews: [{ rating: 5, comment: 'Great product!' }] }
    ];
    const mockUsers = [];

    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('products.json')) {
        return JSON.stringify(mockProducts);
      } else if (filePath.includes('reviews.json')) {
        return JSON.stringify(mockReviews);
      } else if (filePath.includes('users.json')) {
        return JSON.stringify(mockUsers);
      }
      return null;
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product if it exists', async () => {
      const response = await request(app).get('/api/products/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, name: 'Product 1', price: 10.0, rating: 4.5, images: [] });
    });

    it('should return 404 if the product does not exist', async () => {
      const response = await request(app).get('/api/products/3');
      expect(response.status).toBe(404);
      expect(response.text).toBe('Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should add a new product', async () => {
      const newProduct = { name: 'Product 3', price: 30.0, rating: 4.8, images: [] };
      const response = await request(app).post('/api/products').send(newProduct);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 3, ...newProduct });
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = { name: '', price: -10, rating: 6, images: [] };
      const response = await request(app).post('/api/products').send(invalidProduct);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid product name');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const updatedProduct = { name: 'Updated Product 1', price: 15.0, rating: 4.6, images: [] };
      const response = await request(app).put('/api/products/1').send(updatedProduct);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, ...updatedProduct });
    });

    it('should return 404 if the product does not exist', async () => {
      const updatedProduct = { name: 'Non-existent Product', price: 15.0, rating: 4.6, images: [] };
      const response = await request(app).put('/api/products/3').send(updatedProduct);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete an existing product', async () => {
      const response = await request(app).delete('/api/products/1');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product deleted');
    });

    it('should return 404 if the product does not exist', async () => {
      const response = await request(app).delete('/api/products/3');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('GET /api/products/:id/reviews', () => {
    it('should return reviews for a product', async () => {
      const response = await request(app).get('/api/products/1/reviews');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ rating: 5, comment: 'Great product!' }]);
    });

    it('should return an empty array if no reviews are found', async () => {
      const response = await request(app).get('/api/products/2/reviews');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/products/:id/reviews', () => {
    it('should add a review to a product', async () => {
      const newReview = { rating: 4, comment: 'Good product' };
      const response = await request(app).post('/api/products/1/reviews').send(newReview);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ ...newReview, productId: 1 });
    });

    it('should return 404 if the product does not exist', async () => {
      const newReview = { rating: 4, comment: 'Good product' };
      const response = await request(app).post('/api/products/3/reviews').send(newReview);
      expect(response.status).toBe(404);
      expect(response.text).toBe('Product not found');
    });
  });

  describe('GET /api/reviews', () => {
    it('should return all reviews', async () => {
      const response = await request(app).get('/api/reviews');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ productId: 1, reviews: [{ rating: 5, comment: 'Great product!' }] }]);
    });
  });

  describe('POST /create-payment-intent', () => {
    it('should create a payment intent', async () => {
      const items = [{ amount: 10 }];
      const response = await request(app).post('/create-payment-intent').send({ items });
      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBeDefined();
    });
  });

  describe('GET /auth_config.json', () => {
    it('should return the configuration file if it exists', async () => {
      const mockConfig = { domain: 'example.com', clientId: 'abc123' };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const response = await request(app).get('/auth_config.json');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockConfig);
    });

    it('should return 404 if the configuration file does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      const response = await request(app).get('/auth_config.json');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Configuration file not found');
    });
  });

  describe('POST /api/upload', () => {
    it('should upload an image', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('image', path.join(__dirname, 'test-image.jpg'));

      expect(response.status).toBe(200);
      expect(response.body.filePath).toBeDefined();
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app).post('/api/upload');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });
  });
});
