console.log("admin.js loaded");

document.getElementById('admin-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;

  if (username === 'admin' && password === 'password') {
      document.getElementById('admin-login-form').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
  } else {
      alert('Invalid credentials');
  }
});

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

document.getElementById('add-product-form').addEventListener('submit', (e) => {
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
  })
  .catch((error) => {
    console.error('Error adding product:', error);
    alert('There was an error adding the product.');
  });
});
