console.log("admin.js loaded");

const dropArea = document.getElementById("image-drop-area");
const fileInput = document.getElementById("image-file-input");
const previewImage = document.getElementById("image-preview");
let selectedFile = null;

// Highlight drop area on dragover
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragging");
});

// Remove highlight on dragleave
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragging");
});

// Handle file drop
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragging");

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    selectedFile = e.dataTransfer.files[0];
    showPreview(selectedFile);
  }
});

// Handle manual file selection
fileInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  showPreview(selectedFile);
});

// Click-to-select file
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// Show image preview
function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
  };
  reader.readAsDataURL(file);
}

document.getElementById('add-product-form').addEventListener('submit', addProductHandler);

function addProductHandler(e) {
  e.preventDefault();
  console.log("Form submitted");  // Add this line for debugging

  const productName = document.getElementById('product-name').value;
  const productPrice = document.getElementById('product-price').value;
  const productRating = document.getElementById('product-rating').value; // Rating field
  let productImage = previewImage.src; // Image URL from the preview

  // Check if an image was selected
  if (!productImage || productImage === '') {
    alert('Please select an image for the product.');
    return;
  }

  const newProduct = {
    name: productName,
    price: parseFloat(productPrice),
    rating: parseFloat(productRating), // Ensure it's a number
    image: productImage,  // Image URL
  };

  console.log('New product data:', newProduct); // Add this to check the data

  // Upload image first if necessary
  // If you want to upload the image to the server before submitting the product
  const formData = new FormData();
  formData.append('image', selectedFile);

  // Upload the image and get the URL
  fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.filePath) {
      newProduct.image = data.filePath;  // Update product image URL with the path received from server

      // Now submit the product data with the image URL
      return fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });
    } else {
      throw new Error('Failed to upload image');
    }
  })
  .then((response) => response.json())
  .then((data) => {
    console.log('Added product:', data); // Check what data is returned
    alert(`Product ${data.name} added!`);
    loadAdminProducts();
  })
  .catch((error) => {
    console.error('Error adding product:', error);
    alert('There was an error adding the product.');
  });
}

// Function to load products for editing/removal
function loadAdminProducts() {
  fetch('http://localhost:3000/api/products')
    .then(response => response.json())
    .then(products => {
      const productList = document.getElementById('product-list');
      productList.innerHTML = products.map(product => `
        <div class="admin-product-item">
          <img src="${product.image}" alt="${product.name}" class="admin-product-image" />
          <div class="admin-product-details">
            <p class="admin-product-name">${product.name}</p>
            <p class="admin-product-price">£${product.price.toFixed(2)}</p>
            <p class="admin-product-rating">Rating: ${product.rating}</p>
          </div>
          <button onclick="editProduct(${product.id})">Edit</button>
          <button onclick="removeProduct(${product.id})">Remove</button>
        </div>
      `).join('');
    })
    .catch(error => console.error('Error loading products:', error));
}

// Function to edit a product
function editProduct(productId) {
  fetch(`http://localhost:3000/api/products/${productId}`)
    .then(response => response.json())
    .then(product => {
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-rating').value = product.rating;
      previewImage.src = product.image;
      previewImage.style.display = 'block';
      selectedFile = null; // Reset selected file

      // Update form submission to handle editing
      const form = document.getElementById('add-product-form');
      form.removeEventListener('submit', addProductHandler);
      form.addEventListener('submit', (e) => updateProduct(e, productId));
    })
    .catch(error => console.error('Error fetching product:', error));
}

// Function to update a product
function updateProduct(e, productId) {
  e.preventDefault();

  const updatedProduct = {
    name: document.getElementById('product-name').value,
    price: parseFloat(document.getElementById('product-price').value),
    rating: parseFloat(document.getElementById('product-rating').value),
    image: previewImage.src
  };

  fetch(`http://localhost:3000/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedProduct)
  })
  .then(response => response.json())
  .then(data => {
    alert(`Product ${data.name} updated!`);
    loadAdminProducts();
  })
  .catch(error => {
    console.error('Error updating product:', error);
    alert('There was an error updating the product.');
  });
}

// Function to remove a product
function removeProduct(productId) {
  fetch(`http://localhost:3000/api/products/${productId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    alert(`Product removed!`);
    loadAdminProducts();
  })
  .catch(error => {
    console.error('Error removing product:', error);
    alert('There was an error removing the product.');
  });
}

// Initial load of products for admin
loadAdminProducts();
