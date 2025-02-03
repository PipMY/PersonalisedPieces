describe('Cart Operations', () => {
    beforeEach(() => {
      localStorage.clear();
      cart = [];
    });
  
    test('addToCart updates cart and localStorage', async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({ json: () => Promise.resolve({ id: 1, name: 'Product', price: 10 }) })
      );
      
      await addToCart(1);
      expect(cart.length).toBe(1);
      expect(localStorage.getItem('cart')).toContain('Product');
    });
  
    test('removeFromCart updates cart state', () => {
      cart = [{ id: 1 }, { id: 2 }];
      removeFromCart(1);
      expect(cart.length).toBe(1);
      expect(cart[0].id).toBe(2);
    });
  
    test('loadCart filters unavailable items', async () => {
      localStorage.setItem('cart', JSON.stringify([{ id: 1 }, { id: 2 }]));
      fetch.mockImplementationOnce(() =>
        Promise.resolve({ json: () => Promise.resolve([{ id: 1 }]) })
      );
      
      await loadCart();
      expect(cart.length).toBe(1);
    });
  });