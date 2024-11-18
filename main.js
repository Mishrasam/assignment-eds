// React-like State Management
const createState = (initialState) => {
  let state = initialState;
  const listeners = [];

  return {
    getState: () => state,
    setState: (newState) => {
      state = newState;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.push(listener);
    },
  };
};

// State variables
const productsState = createState([]); // Holds all products
const visibleProductsState = createState([]); // Holds currently visible products
const filtersState = createState([]); // Tracks selected filters
const isLoading = createState(false); //

let currentPage = 0; // Tracks the current page for "Load More"

// Fetch Products from API
const fetchProducts = async (filters = [], sortKey = "price") => {
  const response = await fetch("https://fakestoreapi.com/products");
  const data = await response.json();

  // Apply category filters
  let filteredProducts = data;
  if (filters.length > 0) {
    filteredProducts = data.filter((product) =>
      filters.some(
        (filter) => product.category.toLowerCase() === filter.toLowerCase()
      )
    );
  }

  // Apply sorting
  if (sortKey === "price") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortKey === "name") {
    filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
  }

  return filteredProducts;
};

// Render Products
const renderProducts = () => {
  const visibleProducts = visibleProductsState.getState();
  const productsContainer = document.querySelector(".products");
  const resultsCount = document.getElementById("results-count");

  resultsCount.textContent = `${visibleProducts.length} Results`;

  if (isLoading.getState() === true) {
    productsContainer.innerHTML = "Loading...";
    return;
  }

  productsContainer.innerHTML = visibleProducts
    .map(
      (product) => `
        <div class="product-card">
          <div class="card-image-container">
            <img src="${product.image}" alt="${
        product.title
      }" class="card-image">
          </div>
          <div class="card-body">
           <h3 class="card-title">${product.title}</h3>
            <p class="card-price">$${product.price.toFixed(2)}</p>
          </div>
          <div class="card-footer">
            <span class="wishlist-icon">♡</span>
        </div>
        </div>
      `
    )
    .join("");
};

// Load More Products
const loadMoreProducts = () => {
  const allProducts = productsState.getState();
  const visibleProducts = visibleProductsState.getState();

  const nextProducts = allProducts.slice(
    visibleProducts.length,
    visibleProducts.length + 10
  );
  visibleProductsState.setState([...visibleProducts, ...nextProducts]);

  // Hide "Load More" button if all products are displayed
  if (visibleProductsState.getState().length >= allProducts.length) {
    document.getElementById("load-more").style.display = "none";
  }
};

// Handle Filter Changes
const handleFilterChange = async () => {
  isLoading.setState(true);
  const checkboxes = document.querySelectorAll(".filter-checkbox");
  const selectedFilters = Array.from(checkboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  // Update filtersState with selected filters
  filtersState.setState(selectedFilters);

  // Fetch and update products based on the new filters
  const sortedBy = document.getElementById("sort-dropdown").value;
  const updatedProducts = await fetchProducts(
    filtersState.getState(),
    sortedBy
  );

  productsState.setState(updatedProducts);
  isLoading.setState(false);
  visibleProductsState.setState(updatedProducts.slice(0, 10)); // Show only the first 10 products
  document.getElementById("load-more").style.display = "block"; // Reset "Load More" button visibility
};

// Handle Sort Changes
const handleSortChange = async () => {
  const sortedBy = document.getElementById("sort-dropdown").value;

  // Fetch and update products based on sorting and active filters
  const updatedProducts = await fetchProducts(
    filtersState.getState(),
    sortedBy
  );

  productsState.setState(updatedProducts);
  visibleProductsState.setState(updatedProducts.slice(0, 10)); // Show only the first 10 products
  document.getElementById("load-more").style.display = "block"; // Reset "Load More" button visibility
};

// Initialize Application
const init = async () => {
  // Subscribe render functions to state changes
  visibleProductsState.subscribe(renderProducts);
  isLoading.subscribe(renderProducts);

  // Fetch initial products
  isLoading.setState(true);
  const initialProducts = await fetchProducts();
  productsState.setState(initialProducts);
  visibleProductsState.setState(initialProducts.slice(0, 10)); // Show only the first 10 products
  isLoading.setState(false);

  // Add event listeners for filter checkboxes
  document
    .querySelectorAll(".filter-checkbox")
    .forEach((checkbox) =>
      checkbox.addEventListener("change", handleFilterChange)
    );

  // Add event listener for sort dropdown
  document
    .getElementById("sort-dropdown")
    .addEventListener("change", handleSortChange);

  // Add event listener for "Load More" button
  document
    .getElementById("load-more")
    .addEventListener("click", loadMoreProducts);
};
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.getElementById("menu-icon");
  const filters = document.getElementById("filters");
  const closeFilters = document.getElementById("close-filters");

  // Open the filter menu
  menuIcon.addEventListener("click", () => {
    filters.classList.add("open");
  });

  // Close the filter menu
  closeFilters.addEventListener("click", () => {
    filters.classList.remove("open");
  });
});

init();
