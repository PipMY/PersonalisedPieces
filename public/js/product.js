document.addEventListener('DOMContentLoaded', () => {
  const productId = new URLSearchParams(window.location.search).get('id');
  if (productId) {
    fetch(`http://localhost:3000/api/products/${productId}`)
      .then(response => response.json())
      .then(product => {
        const productDetails = document.getElementById('product-details');
        productDetails.innerHTML = `
          <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" />
            <div class="product-info">
              <h4 class="brand">Brand Name</h4>
              <h3 class="product-title">${product.name}</h3>
              <div class="rating">
                ${generateStars(product.rating)} ${product.rating.toFixed(1)}
              </div>
              <p class="price">£${product.price.toFixed(2)}</p>
              <button class="add-to-cart" onclick="addToCart(${product.id})">
                Add to Cart
              </button>
            </div>
          </div>
        `;
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        document.getElementById('product-details').innerHTML = 'Failed to load product details.';
      });
  } else {
    document.getElementById('product-details').innerHTML = 'Product not found.';
  }
});

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
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} added to cart.`);
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
    });
}
