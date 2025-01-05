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
      .catch(error => console.error('Error loading contact page:', error));
  },
  gallery: () => {
    fetch('gallery.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
      })
      .catch(error => console.error('Error loading gallery page:', error));
  },
  shop: () => {
    fetch('shop.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        loadProducts();
      })
      .catch(error => console.error('Error loading shop page:', error));
  },
  admin: () => {
    fetch('admin.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        loadAdminScript();
      })
      .catch(error => console.error('Error loading admin page:', error));
  },
};

function navigate(route) {
  content.classList.add('fade-out');
  setTimeout(() => {
    window.history.pushState({}, route, `#${route}`);
    routes[route]();
    setActiveLink(route);
    content.classList.remove('fade-out');
  }, 200); // Match the duration of the CSS transition
}

function setActiveLink(route) {
  const links = document.querySelectorAll('header li a');
  links.forEach(link => {
    if (link.id === `${route}-link`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
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

document.getElementById('admin-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('admin');
});

// Load Products from the server
function loadProducts() {
  const productsContainer = document.getElementById('products');

  // Fetch products data from the server
  fetch('http://localhost:3000/api/products') // Replace with your server URL if needed
    .then((response) => response.json())
    .then((products) => {
      // Display products on the page
      productsContainer.innerHTML = products
        .map(
          (product) => `
            <div class="product-card">
              <img src="${product.image}" alt="${product.name}" class="product-image" />
              <div class="product-info">
                <h4 class="brand">Brand Name</h4>
                <h3 class="product-title">${product.name}</h3>
                <div class="rating">
                  ${generateStars(product.rating)} ${product.rating.toFixed(1)}
                </div>
                <p class="price">£${product.price.toFixed(2)}</p>
              </div>
              <button class="add-to-cart" onclick="addToCart(${product.id})">
                <img src="../assets/images/basket3.svg" alt="Cart Icon" />
              </button>
            </div>
          `
        )
        .join('');
    })
    .catch((error) => {
      console.error('Error fetching products:', error);
      productsContainer.innerHTML = 'Failed to load products.';
    });
}

// Helper function to generate stars based on the rating
function generateStars(rating) {
  const fullStarURL = "../assets/images/star-fill.svg"; // URL for full star
  const halfStarURL = "../assets/images/star-half.svg"; // URL for half star
  const emptyStarURL = "../assets/images/star.svg"; // URL for empty star (if needed)

  const fullStars = Math.floor(rating); // Number of full stars
  const halfStar = rating % 1 >= 0.5; // Check if there's a half star
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Remaining empty stars

  const fullStarHTML = `<img src="${fullStarURL}" alt="Full Star" class="star-icon" />`;
  const halfStarHTML = halfStar
    ? `<img src="${halfStarURL}" alt="Half Star" class="star-icon" />`
    : "";
  const emptyStarHTML = `<img src="${emptyStarURL}" alt="Empty Star" class="star-icon empty" />`;

  return (
    fullStarHTML.repeat(fullStars) +
    halfStarHTML +
    emptyStarHTML.repeat(emptyStars)
  );
}



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

// Function to dynamically load the admin.js script
function loadAdminScript() {
  const script = document.createElement('script');
  script.src = 'js/admin.js';
  document.body.appendChild(script);
}

// Initialize App
window.addEventListener('popstate', () => {
  const route = location.hash.replace('#', '') || 'home';
  routes[route]();
  setActiveLink(route);
});

const initialRoute = location.hash.replace('#', '') || 'home';
routes[initialRoute]();
setActiveLink(initialRoute);

if (location.hash.includes('cart')) {
  loadCart();
}