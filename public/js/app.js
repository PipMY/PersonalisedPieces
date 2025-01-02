const app = document.getElementById('app');
const content = document.getElementById('content');

const routes = {
  home: () => {
    content.innerHTML = `
      <h1>Welcome to Our Shop</h1>
      <div id="products"></div>
      <h2>Add a Product</h2>
      <form id="add-product-form">
        <input type="text" id="product-name" placeholder="Product Name" required />
        <input type="number" id="product-price" placeholder="Product Price" required />
        <button type="submit">Add Product</button>
      </form>
    `;
    loadProducts();
    setupAddProductForm();  // Initialize the form
  },
  cart: () => {
    content.innerHTML = `<h1>Your Cart</h1><div id="cart-items"></div>`;
    loadCart();
  },
};

function navigate(route) {
  window.history.pushState({}, route, `#${route}`);
  routes[route]();
}

// Link Click Event Handlers
document.getElementById('home-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('home');
});

document.getElementById('cart-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('cart');
});

// Load Products from the server
function loadProducts() {
  const productsContainer = document.getElementById('products');

  // Fetch products data from the server
  fetch('http://localhost:3000/api/products')  // Replace with your server URL if needed
    .then((response) => response.json())
    .then((products) => {
      // Display products on the page
      productsContainer.innerHTML = products
        .map(
          (product) =>
            `<div class="product">
              <h3>${product.name}</h3>
              <p>$${product.price}</p>
              <button onclick="addToCart(${product.id})">Add to Cart</button>
            </div>`
        )
        .join('');
    })
    .catch((error) => {
      console.error('Error fetching products:', error);
      productsContainer.innerHTML = 'Failed to load products.';
    });
}

// Cart Handling
let cart = [];

function addToCart(productId) {
  fetch(`http://localhost:3000/api/products/${productId}`)
    .then((response) => response.json())
    .then((product) => {
      cart.push(product);
      saveCart();
      alert(`${product.name} added to cart.`);
    })
    .catch((error) => {
      console.error('Error adding to cart:', error);
    });
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
  const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = savedCart;
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = cart
    .map(
      (item) =>
        `<div class="cart-item">
          <p>${item.name} - $${item.price}</p>
        </div>`
    )
    .join('');
}

// Setup Add Product Form
function setupAddProductForm() {
  const form = document.getElementById('add-product-form');
  form.addEventListener('submit', (e) => {
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
        loadProducts();  // Reload products after adding the new one
      })
      .catch((error) => {
        console.error('Error adding product:', error);
      });
  });
}

// Initialize App
window.addEventListener('popstate', () => {
  const route = location.hash.replace('#', '') || 'home';
  routes[route]();
});

if (location.hash) {
  routes[location.hash.replace('#', '')]();
} else {
  routes.home();
}

if (location.hash.includes('cart')) {
  loadCart();
}
