document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    fetch(`http://localhost:3000/api/products/${productId}`)
      .then(response => response.json())
      .then(product => {
        const productDetailsContainer = document.getElementById('product-details');
        fetch(`http://localhost:3000/api/products/${productId}/reviews`)
          .then(response => response.json())
          .then(reviews => {
            const averageRating = calculateAverageRating(reviews);
            const reviewCount = reviews.length;
            productDetailsContainer.innerHTML = `
              <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image" />
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
            `;
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
  } else {
    document.getElementById('product-details').innerHTML = 'Product not found.';
  }
});

function generateStars(rating) {
  const fullStarURL = "../assets/images/star-fill.svg";
  const halfStarURL = "../assets/images/star-half.svg";
  const emptyStarURL = "../.assets/images/star.svg";

  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const fullStarHTML = `<img src="${fullStarURL}" alt="Full Star" class="star-icon" />`;
  const halfStarHTML = halfStar ? `<img src="${halfStarURL}" alt="Half Star" class="star-icon" />` : "";
  const emptyStarHTML = `<img src="${emptyStarURL}" alt="Empty Star" class="star-icon empty" />`;

  return fullStarHTML.repeat(fullStars) + halfStarHTML + emptyStarHTML.repeat(emptyStars);
}

function addToCart(productId) {
  fetch(`http://localhost:3000/api/products/${productId}`)
    .then(response => response.json())
    .then(product => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
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
    .catch(error => {
      console.error('Error adding to cart:', error);
    });
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCart() {
  // Implement cart update logic if needed
}

function calculateAverageRating(reviews) {
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}
