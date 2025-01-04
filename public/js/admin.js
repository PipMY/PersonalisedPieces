console.log("admin.js loaded");

document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
  
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
  
    // Simple authentication check (replace with real authentication)
    if (username === 'admin' && password === 'password') {
      document.getElementById('admin-login-form').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
    } else {
      alert('Invalid credentials');
    }
  });
  
  document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
  
    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
  
    const newProduct = {
      name: productName,
      price: parseFloat(productPrice),
    };
  
    // Send POST request to add the product
    fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newProduct),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(`Product ${data.name} added!`);
      })
      .catch((error) => {
        console.error('Error adding product:', error);
      });
  });