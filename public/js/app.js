const app = document.getElementById('app');
const content = document.getElementById('content');

const routes = {
  home: () => {
    fetch('home.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
      })
      .catch(error => console.error('Error loading home page:', error));
  },
  cart: () => {
    fetch('cart.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        loadCart();
      })
      .catch(error => console.error('Error loading cart page:', error));
  },
  about: () => {
    fetch('about.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
      })
      .catch(error => console.error('Error loading about page:', error));
  },
  contact: () => {
    fetch('contact.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
      })
      .catch(error => console.error('Error loading about page:', error));
  },
  gallery: () => {
    fetch('gallery.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        
      })
      .catch(error => console.error('Error loading about page:', error));
  },
  shop: () => {
    fetch('shop.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        loadProducts();
        setupAddProductForm();  // Initialize the form
      })
      .catch(error => console.error('Error loading about page:', error));
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

document.getElementById('about-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('about');
});

document.getElementById('contact-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('contact');
});

document.getElementById('gallery-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('gallery');
});

document.getElementById('shop-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('shop');
});

function navigate(route) {
  window.history.pushState({}, route, `#${route}`);
  routes[route]();
}
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
              <p>£${product.price}</p>
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
          <p>${item.name} - £${item.price}</p>
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