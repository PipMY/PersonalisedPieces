describe('Product Loading', () => {
    test('loadProducts fetches and displays products', async () => {
      document.body.innerHTML = '<div id="products"></div>';
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve([{ id: 1, name: 'Product', price: 10, image: 'test.jpg' }])
        })
      );
  
      await loadProducts();
      expect(document.querySelectorAll('.product-card').length).toBe(1);
    });
  
    test('loadProductDetails shows individual product', async () => {
      document.body.innerHTML = '<div id="product-details"></div>';
      fetch.mockImplementationOnce(() =>
        Promise.resolve({ json: () => Promise.resolve({ id: 1, name: 'Product' }) })
      );
  
      await loadProductDetails(1);
      expect(document.getElementById('product-details').innerHTML).toContain('Product');
    });
  });