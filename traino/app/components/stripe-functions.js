const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const dotenv = require('dotenv');

dotenv.config();

function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
}

// Customers

/**
 * List Customers
 * @param {Object} params - Parameters for listing customers
 * @param {number} params.limit - Number of customers to list
 * @param {string|null} params.startingAfter - ID of the customer to start after
 * @param {Object} params.filters - Additional filters for listing customers
 */
async function listCustomers({
  limit = 10,
  startingAfter = null,
  filters = {},
} = {}) {
  try {
    const customers = await stripe.customers.list({
      limit,
      starting_after: startingAfter,
      ...filters,
    });
    console.log(customers);
  } catch (error) {
    handleError(error, 'listCustomers');
  }
}

/**
 * Delete Customer
 * @param {string} customerId - ID of the customer to delete
 */
async function deleteCustomer(customerId) {
  try {
    const deleted = await stripe.customers.del(customerId);
    console.log(`Deleted customer ${customerId}:`, deleted);
  } catch (error) {
    handleError(error, 'deleteCustomer');
  }
}

/**
 * Update Customer
 * @param {string} customerId - ID of the customer to update
 * @param {Object} updateData - Data to update the customer with
 */
async function updateCustomer(customerId, updateData) {
  try {
    const updatedCustomer = await stripe.customers.update(
      customerId,
      updateData,
    );
    console.log(`Updated customer ${customerId}:`, updatedCustomer);
  } catch (error) {
    handleError(error, 'updateCustomer');
  }
}

/**
 * Create Customer
 * @param {Object} customerData - Data for creating a new customer
 */
async function createCustomer(customerData) {
  try {
    const customer = await stripe.customers.create(customerData);
    console.log('Created customer:', customer);
  } catch (error) {
    handleError(error, 'createCustomer');
  }
}

// Products

/**
 * List Products
 * @param {Object} params - Parameters for listing products
 * @param {number} params.limit - Number of products to list
 * @param {string|null} params.startingAfter - ID of the product to start after
 * @param {Object} params.filters - Additional filters for listing products
 */
async function listProducts({
  limit = 10,
  startingAfter = null,
  filters = {},
} = {}) {
  try {
    const products = await stripe.products.list({
      limit,
      starting_after: startingAfter,
      ...filters,
    });
    console.log(products);
  } catch (error) {
    handleError(error, 'listProducts');
  }
}

/**
 * Delete Product
 * @param {string} productId - ID of the product to delete
 */
async function deleteProduct(productId) {
  try {
    const deleted = await stripe.products.del(productId);
    console.log(`Deleted product ${productId}:`, deleted);
  } catch (error) {
    handleError(error, 'deleteProduct');
  }
}

/**
 * Update Product
 * @param {string} productId - ID of the product to update
 * @param {Object} updateData - Data to update the product with
 */
async function updateProduct(productId, updateData) {
  try {
    const updatedProduct = await stripe.products.update(productId, updateData);
    console.log(`Updated product ${productId}:`, updatedProduct);
  } catch (error) {
    handleError(error, 'updateProduct');
  }
}

/**
 * Create Product
 * @param {Object} productData - Data for creating a new product
 */
async function createProduct(productData) {
  try {
    const product = await stripe.products.create(productData);
    console.log('Created product:', product);
  } catch (error) {
    handleError(error, 'createProduct');
  }
}

// Prices

/**
 * List Prices
 * @param {Object} params - Parameters for listing prices
 * @param {number} params.limit - Number of prices to list
 * @param {string|null} params.startingAfter - ID of the price to start after
 * @param {Object} params.filters - Additional filters for listing prices
 */
async function listPrices({
  limit = 10,
  startingAfter = null,
  filters = {},
} = {}) {
  try {
    const prices = await stripe.prices.list({
      limit,
      starting_after: startingAfter,
      ...filters,
    });
    console.log(prices);
  } catch (error) {
    handleError(error, 'listPrices');
  }
}

/**
 * Delete Price
 * @param {string} priceId - ID of the price to delete
 */
async function deletePrice(priceId) {
  try {
    const deleted = await stripe.prices.del(priceId);
    console.log(`Deleted price ${priceId}:`, deleted);
  } catch (error) {
    handleError(error, 'deletePrice');
  }
}

/**
 * Create Price
 * @param {Object} priceData - Data for creating a new price
 */
async function createPrice(priceData) {
  try {
    const price = await stripe.prices.create(priceData);
    console.log('Created price:', price);
  } catch (error) {
    handleError(error, 'createPrice');
  }
}

/*
Example Usage

(async () => {
  // Customers
  await listCustomers({ limit: 10, filters: { email: 'example@example.com' } });
  await deleteCustomer('customer_id_here');
  await updateCustomer('customer_id_here', { email: 'newemail@example.com' });
  await createCustomer({ email: 'customer@example.com', name: 'John Doe' });

  // Products
  await listProducts({ limit: 10, filters: { active: true } });
  await deleteProduct('product_id_here');
  await updateProduct('product_id_here', { name: 'Updated Product Name' });
  await createProduct({ name: 'New Product', description: 'Product Description' });

  // Prices
  await listPrices({ limit: 10, filters: { product: 'prod_id_here' } });
  await deletePrice('price_id_here');
  await createPrice({ product: 'product_id_here', unit_amount: 2000, currency: 'usd' });
})();
*/
