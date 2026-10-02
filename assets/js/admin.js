'use strict';

/* ============================================
   MARKET FLOW - ADMIN JAVASCRIPT
   Shared Admin Functions
   ============================================ */


/* ============================================
   STORAGE HELPERS
   ============================================ */

function getStorageArray(key) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return [];
        }

        const parsed = JSON.parse(value);

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`Failed to read "${key}" from localStorage:`, error);
        return [];
    }
}


function setStorageArray(key, value) {
    try {
        if (!Array.isArray(value)) {
            console.error(`Cannot save "${key}": value must be an array.`);
            return false;
        }

        localStorage.setItem(key, JSON.stringify(value));

        return true;
    } catch (error) {
        console.error(`Failed to save "${key}" to localStorage:`, error);
        return false;
    }
}


/* ============================================
   STORAGE OBJECT HELPERS
   ============================================ */

function getStorageObject(key, fallback = {}) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        const parsed = JSON.parse(value);

        return parsed && typeof parsed === 'object'
            ? parsed
            : fallback;
    } catch (error) {
        console.error(`Failed to read "${key}" from localStorage:`, error);
        return fallback;
    }
}


function setStorageObject(key, value) {
    try {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            console.error(`Cannot save "${key}": value must be an object.`);
            return false;
        }

        localStorage.setItem(key, JSON.stringify(value));

        return true;
    } catch (error) {
        console.error(`Failed to save "${key}" to localStorage:`, error);
        return false;
    }
}


/* ============================================
   ID HELPERS
   ============================================ */

function getNextId(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return 1;
    }

    const numericIds = items
        .map(item => Number(item?.id))
        .filter(id => Number.isFinite(id) && id >= 0);

    if (numericIds.length === 0) {
        return 1;
    }

    return Math.max(...numericIds) + 1;
}


function sameId(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) {
        return false;
    }

    return String(a) === String(b);
}


/* ============================================
   AUTHENTICATION
   ============================================ */

function checkAuth() {
    let isLoggedIn = false;

    try {
        isLoggedIn =
            sessionStorage.getItem('admin_logged_in') === 'true';
    } catch (error) {
        console.error('Failed to read admin session:', error);
    }

    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}


/* ============================================
   LOGOUT
   ============================================ */

function logout() {
    try {
        sessionStorage.removeItem('admin_logged_in');
        sessionStorage.removeItem('admin_user');
    } catch (error) {
        console.error('Failed to clear admin session:', error);
    }

    window.location.href = 'login.html';
}


/* ============================================
   PRICE FORMATTER
   ============================================ */

function formatPrice(price) {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
        return 'Rp 0';
    }

    return (
        'Rp ' +
        Math.round(numericPrice).toLocaleString('id-ID')
    );
}


/* ============================================
   NUMBER HELPERS
   ============================================ */

function getNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function getNonNegativeNumber(value, fallback = 0) {
    return Math.max(
        0,
        getNumber(value, fallback)
    );
}


/* ============================================
   CATEGORY HELPERS
   ============================================ */

function getCategoryName(categoryId, categories) {
    if (!Array.isArray(categories)) {
        return '-';
    }

    const category = categories.find(category =>
        sameId(category?.id, categoryId)
    );

    if (!category) {
        return '-';
    }

    return (
        category.name_id ||
        category.name_en ||
        '-'
    );
}


function getCategoryById(categoryId, categories = null) {
    const categoryList =
        Array.isArray(categories)
            ? categories
            : getStorageArray('categories');

    return (
        categoryList.find(category =>
            sameId(category?.id, categoryId)
        ) || null
    );
}


/* ============================================
   PRODUCT HELPERS
   ============================================ */

function getProductById(productId) {
    const products = getStorageArray('products');

    return (
        products.find(product =>
            sameId(product?.id, productId)
        ) || null
    );
}


function getProductCountByCategory(categoryId, products = null) {
    const productList =
        Array.isArray(products)
            ? products
            : getStorageArray('products');

    return productList.filter(product =>
        sameId(product?.category_id, categoryId)
    ).length;
}


/* ============================================
   TRACK PRODUCT VIEW
   ============================================ */

function trackView(productId) {
    const products = getStorageArray('products');

    const product = products.find(item =>
        sameId(item?.id, productId)
    );

    if (!product) {
        return false;
    }

    product.views =
        getNonNegativeNumber(product.views) + 1;

    const saved = setStorageArray(
        'products',
        products
    );

    if (!saved) {
        return false;
    }

    addActivity(
        product.id,
        product.name,
        'view'
    );

    return true;
}


/* ============================================
   TRACK SHOPEE CLICK
   ============================================ */

function trackClick(productId) {
    const products = getStorageArray('products');

    const product = products.find(item =>
        sameId(item?.id, productId)
    );

    if (!product) {
        return false;
    }

    product.clicks =
        getNonNegativeNumber(product.clicks) + 1;

    const saved = setStorageArray(
        'products',
        products
    );

    if (!saved) {
        return false;
    }

    addActivity(
        product.id,
        product.name,
        'click'
    );

    return true;
}


/* ============================================
   ACTIVITY LOG
   ============================================ */

function addActivity(
    productId,
    productName,
    type
) {
    const activities =
        getStorageArray('activities');

    const normalizedType =
        type === 'click'
            ? 'click'
            : 'view';

    const activity = {
        product_id: productId,
        product_name: String(
            productName || ''
        ),
        type: normalizedType,
        timestamp: new Date().toISOString()
    };

    activities.push(activity);

    /*
     * Keep only the latest 1000 activities.
     */
    const trimmedActivities =
        activities.length > 1000
            ? activities.slice(-1000)
            : activities;

    return setStorageArray(
        'activities',
        trimmedActivities
    );
}


/* ============================================
   ACTIVITY HELPERS
   ============================================ */

function getActivities() {
    return getStorageArray('activities');
}


function clearActivities() {
    return setStorageArray(
        'activities',
        []
    );
}


/* ============================================
   ADMIN USERNAME
   ============================================ */

function getAdminUsername() {
    try {
        return (
            sessionStorage.getItem('admin_user') ||
            'admin'
        );
    } catch (error) {
        console.error(
            'Failed to read admin username:',
            error
        );

        return 'admin';
    }
}


function updateAdminUsername() {
    const usernameElement =
        document.getElementById('adminUsername');

    if (!usernameElement) {
        return;
    }

    usernameElement.textContent =
        getAdminUsername();
}


/* ============================================
   SAMPLE DATA
   ============================================ */

function initializeSampleData() {
    /*
     * Never overwrite existing data.
     */
    try {
        if (
            localStorage.getItem('initialized') === 'true'
        ) {
            return;
        }
    } catch (error) {
        console.error(
            'Failed to check initialization state:',
            error
        );

        return;
    }


    const existingCategories =
        getStorageArray('categories');

    const existingProducts =
        getStorageArray('products');

    const existingActivities =
        getStorageArray('activities');


    /*
     * Only create sample categories when
     * no category data exists.
     */
    if (existingCategories.length === 0) {
        const sampleCategories = [
            {
                id: 1,
                name_en: 'Gadgets',
                name_id: 'Gadget',
                icon: '📱',
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name_en: 'Fashion',
                name_id: 'Fashion',
                icon: '👕',
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                name_en: 'Home & Living',
                name_id: 'Rumah & Living',
                icon: '🏠',
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 4,
                name_en: 'Beauty',
                name_id: 'Kecantikan',
                icon: '💄',
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 5,
                name_en: 'Gaming',
                name_id: 'Gaming',
                icon: '🎮',
                is_active: true,
                created_at: new Date().toISOString()
            }
        ];

        setStorageArray(
            'categories',
            sampleCategories
        );
    }


    /*
     * Only create sample products when
     * no product data exists.
     */
    if (existingProducts.length === 0) {
        const sampleProducts = [
            {
                id: 1,
                name: 'Wireless Earbuds Pro',
                price: 150000,
                category_id: 1,
                image:
                    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
                shopee_link:
                    'https://shopee.co.id/product/1',
                description:
                    'High quality wireless earbuds with noise cancellation.',
                is_featured: true,
                is_active: true,
                views: 0,
                clicks: 0,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Smart Watch Series 5',
                price: 350000,
                category_id: 1,
                image:
                    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
                shopee_link:
                    'https://shopee.co.id/product/2',
                description:
                    'Feature-rich smartwatch with health tracking.',
                is_featured: true,
                is_active: true,
                views: 0,
                clicks: 0,
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Gaming Mechanical Keyboard',
                price: 450000,
                category_id: 5,
                image:
                    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400',
                shopee_link:
                    'https://shopee.co.id/product/3',
                description:
                    'RGB mechanical keyboard for gaming.',
                is_featured: true,
                is_active: true,
                views: 0,
                clicks: 0,
                created_at: new Date().toISOString()
            }
        ];

        setStorageArray(
            'products',
            sampleProducts
        );
    }


    /*
     * Create activity storage if it does
     * not already exist.
     */
    if (existingActivities.length === 0) {
        setStorageArray(
            'activities',
            []
        );
    }


    try {
        localStorage.setItem(
            'initialized',
            'true'
        );
    } catch (error) {
        console.error(
            'Failed to mark sample data as initialized:',
            error
        );
    }
}


/* ============================================
   RESET STATISTICS
   ============================================ */

function resetStatistics() {
    const products =
        getStorageArray('products');

    const updatedProducts =
        products.map(product => ({
            ...product,
            views: 0,
            clicks: 0
        }));

    const productsSaved =
        setStorageArray(
            'products',
            updatedProducts
        );

    const activitiesSaved =
        clearActivities();

    return (
        productsSaved &&
        activitiesSaved
    );
}


/* ============================================
   DOM HELPERS
   ============================================ */

function setText(selector, value) {
    const element =
        document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent =
        value === null || value === undefined
            ? ''
            : String(value);
}


function showElement(element) {
    if (!element) {
        return;
    }

    element.hidden = false;
    element.style.display = '';
}


function hideElement(element) {
    if (!element) {
        return;
    }

    element.hidden = true;
}


function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


/* ============================================
   MODAL HELPERS
   ============================================ */

function closeModalById(modalId) {
    const modal =
        document.getElementById(modalId);

    if (!modal) {
        return;
    }

    modal.style.display = 'none';
}


function setupModalCloseHandlers() {
    document.addEventListener(
        'keydown',
        event => {
            if (event.key !== 'Escape') {
                return;
            }

            document
                .querySelectorAll('.modal')
                .forEach(modal => {
                    if (
                        getComputedStyle(modal).display !== 'none'
                    ) {
                        modal.style.display = 'none';
                    }
                });
        }
    );

    document
        .querySelectorAll('.modal')
        .forEach(modal => {
            modal.addEventListener(
                'click',
                event => {
                    if (event.target === modal) {
                        modal.style.display = 'none';
                    }
                }
            );
        });
}


/* ============================================
   ADMIN INITIALIZATION
   ============================================ */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
         * Initialize sample data before
         * individual admin pages read storage.
         */
        initializeSampleData();

        /*
         * Update username if the page
         * contains the admin username element.
         */
        updateAdminUsername();

        /*
         * Global modal behavior.
         */
        setupModalCloseHandlers();
    }
);


/* ============================================
   MODULE EXPORT
   ============================================ */

if (
    typeof module !== 'undefined' &&
    module.exports
) {
    module.exports = {
        getStorageArray,
        setStorageArray,

        getStorageObject,
        setStorageObject,

        getNextId,
        sameId,

        checkAuth,
        logout,

        formatPrice,

        getNumber,
        getNonNegativeNumber,

        getCategoryName,
        getCategoryById,

        getProductById,
        getProductCountByCategory,

        trackView,
        trackClick,

        addActivity,
        getActivities,
        clearActivities,

        getAdminUsername,
        updateAdminUsername,

        initializeSampleData,
        resetStatistics,

        setText,
        showElement,
        hideElement,
        scrollToTop,

        closeModalById,
        setupModalCloseHandlers
    };
}