console.log("admin.js loaded");

const dropArea = document.getElementById("image-drop-area");
const fileInput = document.getElementById("image-file-input");
const imagePreviewContainer = document.getElementById("image-preview-container");
let images = [];

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
    handleFiles(e.dataTransfer.files);
  }
});

// Handle manual file selection
fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

// Click-to-select file
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// Show image preview
function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    images.push(file);
    updateImagePreview();
  };
  reader.readAsDataURL(file);
}

function handleFiles(files) {
  for (const file of files) {
    showPreview(file);
  }
}

function updateImagePreview() {
  imagePreviewContainer.innerHTML = images.map(image => `<img src="${URL.createObjectURL(image)}" alt="Image Preview" class="image-preview" />`).join('');
}

document.getElementById('add-product-form').addEventListener('submit', addProductHandler);

document.getElementById('customizable-checkbox').addEventListener('change', (e) => {
  const customizationDetailsContainer = document.getElementById('customization-details-container');
  customizationDetailsContainer.style.display = e.target.checked ? 'block' : 'none';
});

function addProductHandler(e) {
  e.preventDefault();
  console.log("Form submitted");  // Add this line for debugging

  const productName = document.getElementById('product-name').value;
  const productPrice = document.getElementById('product-price').value;
  const isCustomizable = document.getElementById('customizable-checkbox').checked;
  const customizationDetails = document.getElementById('customization-details').value;

  // Check if an image was selected
  if (images.length === 0) {
    alert('Please select an image for the product.');
    return;
  }

  const newProduct = {
    name: productName,
    price: parseFloat(productPrice),
    rating: 0, // Set rating to 0 by default
    images: [],  // Image URLs will be added after upload
    customizable: isCustomizable,
    customizationDetails: isCustomizable ? customizationDetails : null
  };

  console.log('New product data:', newProduct); // Add this to check the data

  // Upload images and get URLs
  const uploadPromises = images.map((image, index) => {
    const formData = new FormData();
    formData.append('image', image, `image${index}.jpg`);

    return fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      if (data.filePath) {
        return data.filePath;
      } else {
        throw new Error('Failed to upload image');
      }
    });
  });

  Promise.all(uploadPromises)
    .then(imageUrls => {
      newProduct.images = imageUrls;

      // Now submit the product data with the image URLs
      return fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });
    })
    .then(response => response.json())
    .then(data => {
      console.log('Added product:', data); // Check what data is returned
      alert(`Product ${data.name} added!`);
      loadAdminProducts();
    })
    .catch(error => {
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
          <img src="${product.images[0]}" alt="${product.name}" class="admin-product-image" />
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
      images = product.images.map(url => {
        const img = new Image();
        img.src = url;
        return img;
      });
      updateImagePreview();

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
    rating: 0, // Set rating to 0 by default
    images: images.map(image => image.src)
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
