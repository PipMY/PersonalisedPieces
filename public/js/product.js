document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (productId) {
    loadProductDetails(productId);
  } else {
    document.getElementById('product-details').innerHTML = 'Product not found.';
  }
});

function generateStars(rating) {
  const fullStarURL = "../assets/images/star-fill.svg";
  const halfStarURL = "../assets/images/star-half.svg";
  const emptyStarURL = "../assets/images/star.svg";

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

function loadReviews(productId) {
  fetch(`http://localhost:3000/api/products/${productId}/reviews`)
    .then(response => response.json())
    .then(reviews => {
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
                ${product.customizable ? `<p class="customization-details">Customization: ${product.customizationDetails}</p>` : ''}
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
