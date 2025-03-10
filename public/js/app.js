const app = document.getElementById('app');
const content = document.getElementById('content');

let auth0Client = null;
let cart = [];

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0Client = await auth0.createAuth0Client({
    domain: config.domain,
    clientId: config.clientId
  });
};

window.onload = async () => {
  await configureClient(); // Ensure auth0Client is initialized

  updateUI();

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0Client.handleRedirectCallback();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
};

const updateUI = async () => {
  if (!auth0Client) {
    console.error("auth0Client is not initialized");
    return;
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    const user = await auth0Client.getUser();

    // Access roles from the custom claim
    const namespace = 'https://personalisedpieces.co.uk/'; // Ensure this matches your Action namespace
    const roles = user[`${namespace}roles`] || [];

    // Display roles or navigate based on roles
    if (roles.includes("Admin")) {
      navigate("admin");
    } else {
      navigate("home");
    }

    // Change login button to logout button and display profile picture
    const loginLink = document.getElementById('login-link');
    loginLink.textContent = 'Logout';
    loginLink.removeEventListener('click', loginEventHandler);
    loginLink.addEventListener('click', logoutEventHandler);

    const profilePicture = document.createElement('img');
    profilePicture.classList.add('profile-picture');
    profilePicture.src = user.picture;
    profilePicture.alt = 'img';
    profilePicture.classList.add('profile-picture');
    loginLink.parentNode.insertBefore(profilePicture, loginLink.nextSibling);
  } else {
    // Change logout button to login button and remove profile picture
    const loginLink = document.getElementById('login-link');
    loginLink.textContent = 'Login';
    loginLink.removeEventListener('click', logoutEventHandler);
    loginLink.addEventListener('click', loginEventHandler);

    const profilePicture = document.querySelector('.profile-picture');
    if (profilePicture) {
      profilePicture.remove();
    }
  }
};

const login = async () => {
  await auth0Client.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  });
};

const logout = () => {
  auth0Client.logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  });
};

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
  orders: () => {
    fetch('orders.html')
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        loadOrderHistory();
      })
      .catch(error => console.error('Error loading orders page:', error));
  },
};

function navigate(route) {
  content.classList.add('fade-out');
  setTimeout(async () => {
    if (route === "admin") {
      // Check if the user is authenticated and has the Admin role
      const isAuthenticated = await auth0Client.isAuthenticated();
      if (!isAuthenticated) {
        alert("You must be logged in to access the admin page.");
        navigate("home"); // Redirect to home if not authenticated
        return;
      }

      const user = await auth0Client.getUser();
      const namespace = 'https://personalisedpieces.co.uk/'; // Ensure this matches your Action namespace
      const roles = user[`${namespace}roles`] || [];
      if (!roles.includes("Admin")) {
        alert("You do not have permission to access the admin page.");
        navigate("home"); // Redirect to home if not authorized
        return;
      }
    }

    window.history.pushState({}, route, `#${route}`);
    if (routes[route]) {
      routes[route]();
    } else {
      console.error(`Route ${route} not found`);
    }
    setActiveLink(route);
    content.classList.remove('fade-out');
  }, 200); // Match the duration of the CSS transition
}

function setActiveLink(route) {
  const links = document.querySelectorAll('header li a');
  links.forEach(link => {
    if (link.id === `${route}-link`) {
      link.classList.add('active', 'disabled-link');
    } else {
      link.classList.remove('active', 'disabled-link');
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

document.getElementById('shop-link').addEventListener('click', (e) => {
  e.preventDefault();
  navigate('shop');
});

const loginEventHandler = (e) => {
  e.preventDefault();
  login();
};

const logoutEventHandler = (e) => {
  e.preventDefault();
  logout();
};

document.getElementById('login-link').addEventListener('click', loginEventHandler);

// Load Products from the server
function loadProducts() {
  const productsContainer = document.getElementById('products');

  // Fetch products data from the server
  fetch('http://localhost:3000/api/products') // Replace with your server URL if needed
    .then((response) => response.json())
    .then((products) => {
      // Fetch reviews data from the server
      fetch('http://localhost:3000/api/reviews')
        .then((response) => response.json())
        .then((reviews) => {
          // Display products on the page
          productsContainer.innerHTML = products
            .map((product) => {
              const productReviews = reviews.find((r) => r.productId === product.id);
              const reviewCount = productReviews ? productReviews.reviews.length : 0;
              const averageRating = productReviews ? calculateAverageRating(productReviews.reviews) : product.rating;
              const mainImage = product.images && product.images.length > 0 ? product.images[0] : ''; // Use the first image as the main image
              return `
                <div class="product-card" onclick="navigateToProduct(${product.id})">
                  <img src="${mainImage}" alt="${product.name}" class="product-image" />
                  <div class="product-info">
                    <h4 class="brand">Brand Name</h4>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="rating">
                      ${generateStars(averageRating)} (${reviewCount} reviews)
                    </div>
                    <p class="price">£${product.price.toFixed(2)}</p>
                  </div>
                  <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
                    <img src="../assets/images/basket3.svg" alt="Cart Icon" />
                  </button>
                </div>
              `;
            })
            .join('');
        })
        .catch((error) => {
          console.error('Error fetching reviews:', error);
          productsContainer.innerHTML = 'Failed to load products.';
        });
    })
    .catch((error) => {
      console.error('Error fetching products:', error);
      productsContainer.innerHTML = 'Failed to load products.';
    });
}

let previousRoute = null;

function navigateToProduct(productId) {
  previousRoute = location.hash.replace('#', '') || 'home';
  content.classList.add('fade-out');
  setTimeout(() => {
    fetch(`product.html?id=${productId}`)
      .then(response => response.text())
      .then(html => {
        content.innerHTML = html;
        loadProductDetails(productId);
        window.history.pushState({}, 'product', `#product?id=${productId}`);
        setActiveLink('');
        content.classList.remove('fade-out');
      })
      .catch(error => {
        console.error('Error loading product page:', error);
        content.classList.remove('fade-out');
      });
  }, 200); // Match the duration of the CSS transition
}

function loadProductDetails(productId) {
  fetch(`http://localhost:3000/api/products/${productId}`)
    .then(response => response.json())
    .then(product => {
      const productDetailsContainer = document.getElementById('product-details');
      fetch(`http://localhost:3000/api/products/${productId}/reviews`)
        .then(response => response.json())
        .then(reviews => {
          const averageRating = calculateAverageRating(reviews);
          const reviewCount = reviews.length;
          const imagesHtml = product.images && product.images.length > 0 ? product.images.map(image => `<img src="${image}" alt="${product.name}" class="product-image" />`).join('') : '';
          productDetailsContainer.innerHTML = `
            <div class="product-detail-card">
              <div class="product-images">
                ${imagesHtml}
              </div>
              <div class="product-info">
                <h4 class="brand">Brand Name</h4>
                <h3 class="product-title">${product.name}</h3>
                <div class="rating">
                  ${generateStars(averageRating)} (${reviewCount} reviews)
                </div>
                <p class="price">£${product.price.toFixed(2)}</p>
                <p class="description">${product.description || 'No description available.'}</p>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                  Add to Cart
                </button>
              </div>
            </div>
            <div class="reviews-section">
              <h3>Reviews</h3>
              <div id="reviews-container"></div>
              <form id="review-form">
                <input type="text" id="reviewer-name" placeholder="Your Name" required />
                <textarea id="review-text" placeholder="Your Review" required></textarea>
                <input type="number" id="review-rating" placeholder="Rating (1-5)" min="1" max="5" required />
                <button type="submit">Submit Review</button>
              </form>
            </div>
          `;
          loadReviews(productId);
          document.getElementById('review-form').addEventListener('submit', (e) => submitReview(e, productId));
        })
        .catch(error => {
          console.error('Error fetching reviews:', error);
          productDetailsContainer.innerHTML = 'Failed to load product details.';
        });
    })
    .catch(error => {
      console.error('Error fetching product details:', error);
      document.getElementById('product-details').innerHTML = 'Failed to load product details.';
    });
}

function loadReviews(productId) {
  fetch(`http://localhost:3000/api/products/${productId}/reviews`)
    .then(response => response.json())
    .then(reviews => {
      if (!Array.isArray(reviews)) {
        reviews = [];
      }
      const reviewsContainer = document.getElementById('reviews-container');
      reviewsContainer.innerHTML = reviews.map(review => `
        <div class="review">
          <h4>${review.reviewer}</h4>
          <div class="rating">${generateStars(review.rating)} ${review.rating.toFixed(1)}</div>
          <p>${review.text}</p>
        </div>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading reviews:', error);
      document.getElementById('reviews-container').innerHTML = 'Failed to load reviews.';
    });
}

function submitReview(e, productId) {
  e.preventDefault();
  const reviewer = document.getElementById('reviewer-name').value;
  const text = document.getElementById('review-text').value;
  const rating = parseFloat(document.getElementById('review-rating').value);

  const review = { reviewer, text, rating };

  fetch(`http://localhost:3000/api/products/${productId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(review)
  })
    .then(response => response.json())
    .then(data => {
      alert('Review submitted!');
      loadReviews(productId);
      document.getElementById('review-form').reset();
      updateProductRating(productId);
    })
    .catch(error => {
      console.error('Error submitting review:', error);
      alert('Failed to submit review.');
    });
}

function updateProductRating(productId) {
  fetch(`http://localhost:3000/api/products/${productId}/reviews`)
    .then(response => response.json())
    .then(reviews => {
      const averageRating = calculateAverageRating(reviews);
      const ratingElement = document.querySelector('.product-detail-info .rating');
      ratingElement.innerHTML = `${generateStars(averageRating)} ${averageRating.toFixed(1)}`;
    })
    .catch(error => {
      console.error('Error updating product rating:', error);
    });
}

function calculateAverageRating(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}

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
      const existingProduct = cart.find(item => item.id === productId);
      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        product.quantity = 1;
        cart.push(product);
      }
      saveCart();
      alert(`${product.name} added to cart.`);
      updateCart();
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
  fetch('http://localhost:3000/api/products')
    .then(response => response.json())
    .then(products => {
      const unavailableItems = [];
      cart = savedCart.filter(cartItem => {
        const product = products.find(product => product.id === cartItem.id);
        if (!product) {
          unavailableItems.push(cartItem.name);
        }
        return product !== undefined;
      });
      if (unavailableItems.length > 0) {
        alert(`The following products are no longer sold: ${unavailableItems.join(', ')}`);
      }
      saveCart();
      updateCart();
    })
    .catch(error => {
      console.error('Error loading products:', error);
      cart = savedCart;
      updateCart();
    });
}

function updateCart() {
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image" />
          <div class="cart-item-details">
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-quantity">Quantity: ${item.quantity}</p>
            <p class="cart-item-price">£${item.price.toFixed(2)}</p>
          </div>
          <button class="remove-item" onclick="removeFromCart(${item.id})">×</button>
        </div>
      `
    )
    .join('');

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  document.getElementById('cart-total-amount').textContent = `£${totalAmount.toFixed(2)}`;

  const buyButton = document.createElement('button');
  buyButton.textContent = 'Buy';
  buyButton.classList.add('buy-button');
  buyButton.disabled = cart.length === 0; // Disable if cart is empty
  buyButton.addEventListener('click', buyItems);
  cartItems.appendChild(buyButton);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCart();
}

function buyItems() {
  // Save cart items to localStorage before redirecting to checkout
  localStorage.setItem('checkoutItems', JSON.stringify(cart));
  window.location.href = 'checkout.html';
}

// Function to dynamically load the admin.js script
function loadAdminScript() {
  const script = document.createElement('script');
  script.src = 'js/admin.js';
  document.body.appendChild(script);
}

function loadOrderHistory() {
  fetch('http://localhost:3000/api/users/orders')
    .then(response => response.json())
    .then(orders => {
      const ordersContainer = document.getElementById('orders-container');
      ordersContainer.innerHTML = orders.map(order => `
        <div class="order">
          <h4>Order ID: ${order.orderId}</h4>
          <p>Total: £${order.total.toFixed(2)}</p>
          <ul>
            ${order.items.map(item => `<li>Product ID: ${item.productId}, Quantity: ${item.quantity}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading order history:', error);
      document.getElementById('orders-container').innerHTML = 'Failed to load order history.';
    });
}

window.addEventListener('popstate', async () => {
  const route = location.hash.replace('#', '') || 'home';

  if (route === "admin") {
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (!isAuthenticated) {
      alert("You must be logged in to access the admin page.");
      navigate("home");
      return;
    }

    const user = await auth0Client.getUser();
    const namespace = 'https://personalisedpieces.co.uk/';
    const roles = user[`${namespace}roles`] || [];
    if (!roles.includes("Admin")) {
      alert("You do not have permission to access the admin page.");
      navigate("home");
      return;
    }
  }

  if (route.startsWith('product')) {
    const productId = route.split('=')[1];
    navigateToProduct(productId);
  } else if (route === "" && previousRoute === "shop") {
    navigate("shop");
  } else {
    routes[route]();
    setActiveLink(route);
  }
});

// Handle initial route
(async () => {
  const initialRoute = location.hash.replace('#', '') || 'home';

  if (initialRoute === "admin") {
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (!isAuthenticated) {
      alert("You must be logged in to access the admin page.");
      navigate("home");
      return;
    }

    const user = await auth0Client.getUser();
    const namespace = 'https://personalisedpieces.co.uk/';
    const roles = user[`${namespace}roles`] || [];
    if (!roles.includes("Admin")) {
      alert("You do not have permission to access the admin page.");
      navigate("home");
      return;
    }
  }

  if (routes[initialRoute]) {
    routes[initialRoute]();
    setActiveLink(initialRoute);
  } else {
    console.error(`Route ${initialRoute} not found`);
    navigate('home');
  }

  if (initialRoute === "cart") {
    loadCart();
  }
})();

const initialRoute = location.hash.replace('#', '') || 'home';
routes[initialRoute]();
setActiveLink(initialRoute);

if (location.hash.includes('cart')) {
  loadCart();
}