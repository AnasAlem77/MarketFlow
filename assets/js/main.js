/* ============================================
   MARKET FLOW - MAIN JAVASCRIPT
   Frontend Application
   ============================================ */

'use strict';


/* ============================================
   CONFIGURATION
   ============================================ */

const STORAGE_KEYS = Object.freeze({
    products: 'products',
    categories: 'categories',
    activities: 'activities',
    language: 'lang',
    initialized: 'initialized'
});

const DEFAULT_LANGUAGE = 'id';
const SUPPORTED_LANGUAGES = ['id', 'en'];

const PLACEHOLDER_IMAGE =
    'assets/images/placeholder.svg';


/* ============================================
   APPLICATION STATE
   ============================================ */

let currentLang = getStoredLanguage();

let productDetailViewTracked = false;

let scrollAnimationObserver = null;


/* ============================================
   INITIALIZATION
   ============================================ */

document.addEventListener(
    'DOMContentLoaded',
    async function () {

        /*
         * 1. Make sure fallback/demo data exists.
         */
        initializeSampleData();

        /*
         * 2. Load real data from backend.
         */
        await loadBackendData();

        /*
         * 3. Render frontend content.
         */
        loadCategories();
        loadProducts();

        /*
         * 4. Setup static interactions.
         */
        setupEventListeners();

        /*
         * 5. Setup scroll animations.
         */
        initScrollAnimations();

        /*
         * 6. Product detail page.
         */
        if (
            document.querySelector(
                '.product-detail'
            )
        ) {
            loadProduct(true);
        }

        /*
         * 6b. Category page.
         */
        if (
            document.getElementById(
                'categoryProducts'
            )
        ) {
            loadCategoryProducts();
        }

        /*
         * 7. Search page.
         */
        if (
            document.getElementById(
                'searchResults'
            )
        ) {
            loadSearchPage();
        }
    }
);


/* ============================================
   BACKEND DATA
   ============================================ */

async function loadBackendData() {
    try {
        const [
            productsResponse,
            categoriesResponse
        ] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/categories')
        ]);

        if (!productsResponse.ok) {
            throw new Error(
                `Products API returned ${productsResponse.status}`
            );
        }

        if (!categoriesResponse.ok) {
            throw new Error(
                `Categories API returned ${categoriesResponse.status}`
            );
        }

        const productsData =
            await productsResponse.json();

        const categoriesData =
            await categoriesResponse.json();

        if (
            productsData.success &&
            Array.isArray(
                productsData.products
            )
        ) {
            writeStorage(
                STORAGE_KEYS.products,
                productsData.products
            );
        }

        if (
            categoriesData.success &&
            Array.isArray(
                categoriesData.categories
            )
        ) {
            writeStorage(
                STORAGE_KEYS.categories,
                categoriesData.categories
            );
        }

    } catch (error) {
        console.error(
            'Failed to load backend data:',
            error
        );

        /*
         * Keep localStorage data as fallback
         * if the backend is temporarily unavailable.
         */
    }
}


/* ============================================
   SAFE STORAGE
   ============================================ */

function readStorage(
    key,
    fallback = null
) {
    try {
        const value =
            localStorage.getItem(key);

        if (
            value === null ||
            value === ''
        ) {
            return fallback;
        }

        const parsed =
            JSON.parse(value);

        return parsed;
    } catch (error) {
        console.error(
            `Failed to read localStorage "${key}":`,
            error
        );

        return fallback;
    }
}


function writeStorage(
    key,
    value
) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error(
            `Failed to write localStorage "${key}":`,
            error
        );

        return false;
    }
}


function getProducts() {
    const products =
        readStorage(
            STORAGE_KEYS.products,
            []
        );

    return Array.isArray(products)
        ? products
        : [];
}


function getCategories() {
    const categories =
        readStorage(
            STORAGE_KEYS.categories,
            []
        );

    return Array.isArray(categories)
        ? categories
        : [];
}


function getActivities() {
    const activities =
        readStorage(
            STORAGE_KEYS.activities,
            []
        );

    return Array.isArray(activities)
        ? activities
        : [];
}


/* ============================================
   LANGUAGE BRIDGE
   Translation logic lives in language.js.
   main.js only keeps `currentLang` in sync and
   re-renders its dynamic content when it changes.
   ============================================ */

function getStoredLanguage() {
    if (
        window.MarketFlowLanguage &&
        typeof window.MarketFlowLanguage.getCurrentLanguage === 'function'
    ) {
        return window.MarketFlowLanguage.getCurrentLanguage();
    }

    try {
        const stored =
            localStorage.getItem(
                STORAGE_KEYS.language
            );

        return SUPPORTED_LANGUAGES.includes(stored)
            ? stored
            : DEFAULT_LANGUAGE;

    } catch (error) {
        return DEFAULT_LANGUAGE;
    }
}


async function renderDynamicContent() {
    currentLang = getStoredLanguage();

    await loadBackendData();

    loadCategories();
    loadProducts();

    if (
        document.querySelector(
            '.product-detail'
        )
    ) {
        loadProduct(false);
    }

    if (
        document.getElementById(
            'searchResults'
        )
    ) {
        loadSearchPage();
    }

    if (
        document.getElementById(
            'categoryProducts'
        )
    ) {
        loadCategoryProducts();
    }
}


/* Fires after language.js applied a (new) language. */
window.addEventListener(
    'marketflow:language-applied',
    renderDynamicContent
);


/* ============================================
   PRODUCT MANAGEMENT
   ============================================ */

function loadProducts() {
    const products =
        getProducts();

    const activeProducts =
        products.filter(
            product =>
                product &&
                product.is_active === true
        );

    const featuredProducts =
        activeProducts.filter(
            product =>
                product.is_featured === true
        );

    displayFeaturedProducts(
        featuredProducts
    );

    displayAllProducts(
        activeProducts
    );

    refreshScrollAnimations();
}


function displayFeaturedProducts(
    products
) {
    const container =
        document.getElementById(
            'featuredProducts'
        );

    if (!container) {
        return;
    }

    if (!Array.isArray(products)) {
        products = [];
    }

    if (products.length === 0) {
        container.innerHTML = `
            <p class="no-products">
                ${escapeHtml(
                    t(
                        'featured.no_products',
                        'No featured products yet.'
                    )
                )}
            </p>
        `;

        return;
    }

    container.innerHTML =
        products
            .map(product =>
                createProductCard(product)
            )
            .join('');
}


function displayAllProducts(
    products
) {
    const container =
        document.getElementById(
            'allProducts'
        );

    if (!container) {
        return;
    }

    if (!Array.isArray(products)) {
        products = [];
    }

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    ${getPackageIconSvg()}
                </div>

                <h3>
                    ${escapeHtml(
                        t(
                            'products.no_products',
                            'No products yet'
                        )
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        t(
                            'products.check_back',
                            'Check back soon for amazing products!'
                        )
                    )}
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        products
            .map(product =>
                createProductCard(product)
            )
            .join('');
}


function createProductCard(
    product
) {
    if (!product) {
        return '';
    }

    const categories =
        getCategories();

    const category =
        categories.find(
            item =>
                sameId(
                    item?.id,
                    product?.category_id
                )
        );

    const categoryName =
        category
            ? (
                currentLang === 'id'
                    ? category.name_id
                    : category.name_en
            )
            : '';

    const productName =
        escapeHtml(
            product.name || ''
        );

    const image =
        escapeHtml(
            product.image ||
            PLACEHOLDER_IMAGE
        );

    const numericId =
        Number(product.id);

    if (
        !Number.isFinite(
            numericId
        )
    ) {
        return '';
    }

    const badge =
        product.is_featured === true
            ? `
                <span class="product-badge">
                    ${escapeHtml(
                        t(
                            'common.featured',
                            'Featured'
                        )
                    )}
                </span>
            `
            : '';

    const buyLabel =
        t(
            'common.buy_now',
            currentLang === 'id'
                ? 'Beli Sekarang'
                : 'Buy Now'
        );

    const shareLabel =
        t(
            'common.share',
            'Share'
        );

    return `
        <article
            class="product-card fade-in"
            data-product-id="${numericId}"
            onclick="viewProduct(${numericId})"
            role="button"
            tabindex="0"
            aria-label="${escapeHtml(
                product.name || 'Product'
            )}"
            onkeydown="
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    event.preventDefault();
                    viewProduct(${numericId});
                }
            "
        >

            <div class="product-image">

                ${badge}

                <img
                    src="${image}"
                    alt="${productName}"
                    loading="lazy"
                    decoding="async"
                    onerror="
                        this.onerror = null;
                        this.src = '${PLACEHOLDER_IMAGE}';
                    "
                >

            </div>


            <div class="product-info">

                <div class="product-category">
                    ${escapeHtml(
                        categoryName || ''
                    )}
                </div>


                <h3 class="product-name">
                    ${productName}
                </h3>


                <div class="product-price">
                    ${formatPrice(
                        product.price
                    )}
                </div>


                <div class="product-actions">

                    <button
                        class="btn-buy"
                        type="button"
                        onclick="
                            event.stopPropagation();
                            buyProduct(${numericId});
                        "
                    >
                        ${getCartIconSvg()}
                        <span>
                            ${escapeHtml(
                                buyLabel
                            )}
                        </span>
                    </button>


                    <button
                        class="btn-share"
                        type="button"
                        onclick="
                            event.stopPropagation();
                            shareProduct(${numericId});
                        "
                        title="${escapeHtml(
                            shareLabel
                        )}"
                        aria-label="${escapeHtml(
                            shareLabel
                        )}"
                    >
                        ${getShareIconSvg()}
                    </button>

                </div>

            </div>

        </article>
    `;
}


function getProductById(id) {
    const products =
        getProducts();

    return (
        products.find(
            product =>
                sameId(
                    product?.id,
                    id
                )
        ) || null
    );
}


function viewProduct(id) {
    const product =
        getProductById(id);

    if (!product) {
        showToast(
            t(
                'common.product_not_found',
                'Product not found.'
            ),
            'error'
        );

        return;
    }

    window.location.href =
        buildProductUrl(
            product.id
        );
}


function buyProduct(id) {
    const product =
        getProductById(id);

    if (
        !product ||
        !product.shopee_link
    ) {
        showToast(
            t(
                'common.link_unavailable',
                'Product link is unavailable.'
            ),
            'error'
        );

        return;
    }

    trackClick(
        product.id
    );

    window.open(
        product.shopee_link,
        '_blank',
        'noopener,noreferrer'
    );
}


/* ============================================
   CATEGORY MANAGEMENT
   ============================================ */

function loadCategories() {
    const categories =
        getCategories();

    const activeCategories =
        categories.filter(
            category =>
                category &&
                category.is_active === true
        );

    displayCategories(
        activeCategories
    );
}


function displayCategories(
    categories
) {
    const container =
        document.getElementById(
            'categoriesGrid'
        ) ||
        document.getElementById(
            'categoryGrid'
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(categories) ||
        categories.length === 0
    ) {
        container.innerHTML = `
            <p class="no-products">
                ${escapeHtml(
                    t(
                        'categories.no_categories',
                        'No categories available yet.'
                    )
                )}
            </p>
        `;

        return;
    }

    container.innerHTML =
        categories
            .map(category => {

                const numericId =
                    Number(category.id);

                if (
                    !Number.isFinite(
                        numericId
                    )
                ) {
                    return '';
                }

                const name =
                    currentLang === 'id'
                        ? category.name_id
                        : category.name_en;

                return `
                    <div
                        class="category-item"
                        data-category-id="${numericId}"
                        onclick="viewCategory(${numericId})"
                        role="button"
                        tabindex="0"
                        aria-label="${escapeHtml(
                            name || 'Category'
                        )}"
                        onkeydown="
                            if (
                                event.key === 'Enter' ||
                                event.key === ' '
                            ) {
                                event.preventDefault();
                                viewCategory(${numericId});
                            }
                        "
                    >

                        <div class="category-icon">
                            ${renderCategoryIcon(
                                category.icon
                            )}
                        </div>


                        <div class="category-name">
                            ${escapeHtml(
                                name || ''
                            )}
                        </div>

                    </div>
                `;
            })
            .join('');

    refreshScrollAnimations();
}


function viewCategory(id) {
    const categories =
        getCategories();

    const category =
        categories.find(
            item =>
                sameId(
                    item?.id,
                    id
                )
        );

    if (!category) {
        showToast(
            t(
                'categories.not_found',
                'Category not found.'
            ),
            'error'
        );

        return;
    }

    window.location.href =
        buildCategoryUrl(
            category.id
        );
}


/* ============================================
   CATEGORY PAGE
   ============================================ */

function loadCategoryProducts() {
    const container =
        document.getElementById(
            'categoryProducts'
        );

    if (!container) {
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const categoryId =
        params.get('id');

    const category =
        getCategories().find(
            item => sameId(item?.id, categoryId)
        );

    const titleElement =
        document.getElementById(
            'categoryTitle'
        );

    if (
        titleElement &&
        category
    ) {
        titleElement.textContent =
            currentLang === 'id'
                ? category.name_id
                : category.name_en;

        document.title =
            `${titleElement.textContent} — Market Flow`;
    }

    const sortValue =
        document.getElementById('sortSelect')?.value ||
        'popular';

    const products =
        getProducts()
            .filter(
                product =>
                    product &&
                    product.is_active === true &&
                    (
                        !categoryId ||
                        sameId(
                            product.category_id,
                            categoryId
                        )
                    )
            )
            .sort((a, b) => {
                switch (sortValue) {
                    case 'newest':
                        return (
                            new Date(b.created_at || 0) -
                            new Date(a.created_at || 0)
                        );

                    case 'price_low':
                        return (
                            getSafeNumber(a.price) -
                            getSafeNumber(b.price)
                        );

                    case 'price_high':
                        return (
                            getSafeNumber(b.price) -
                            getSafeNumber(a.price)
                        );

                    default:
                        return (
                            getSafeNumber(b.views) -
                            getSafeNumber(a.views)
                        );
                }
            });

    const noResults =
        document.getElementById(
            'noResults'
        );

    container.innerHTML =
        products
            .map(createProductCard)
            .join('');

    if (noResults) {
        noResults.style.display =
            products.length
                ? 'none'
                : 'flex';
    }

    refreshScrollAnimations();
}


function sortProducts() {
    loadCategoryProducts();
}


/* ============================================
   SEARCH
   ============================================ */

function normalizeSearchText(
    value
) {
    return String(
        value ?? ''
    )
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            ' '
        );
}


function searchProducts(
    query
) {
    const normalizedQuery =
        normalizeSearchText(
            query
        );

    if (!normalizedQuery) {
        return [];
    }

    const products =
        getProducts();

    const categories =
        getCategories();

    const activeProducts =
        products.filter(
            product =>
                product &&
                product.is_active === true
        );

    return activeProducts
        .map(product => {

            const category =
                categories.find(
                    item =>
                        sameId(
                            item?.id,
                            product?.category_id
                        )
                );

            const categoryId =
                category?.id ?? '';

            const categoryIdText =
                normalizeSearchText(
                    categoryId
                );

            const categoryNameId =
                normalizeSearchText(
                    category?.name_id || ''
                );

            const categoryNameEn =
                normalizeSearchText(
                    category?.name_en || ''
                );

            const productName =
                normalizeSearchText(
                    product.name || ''
                );

            const description =
                normalizeSearchText(
                    product.description || ''
                );

            const fields = [
                productName,
                description,
                categoryNameId,
                categoryNameEn
            ].filter(Boolean);

            const matched =
                fields.some(
                    field =>
                        field.includes(
                            normalizedQuery
                        )
                );

            if (!matched) {
                return null;
            }

            let score = 0;

            if (
                productName ===
                normalizedQuery
            ) {
                score += 100;
            }

            if (
                productName.startsWith(
                    normalizedQuery
                )
            ) {
                score += 50;
            }

            if (
                productName.includes(
                    normalizedQuery
                )
            ) {
                score += 30;
            }

            if (
                categoryNameId.includes(
                    normalizedQuery
                ) ||
                categoryNameEn.includes(
                    normalizedQuery
                )
            ) {
                score += 20;
            }

            if (
                description.includes(
                    normalizedQuery
                )
            ) {
                score += 10;
            }

            return {
                product,
                categoryId,
                score
            };
        })
        .filter(Boolean)
        .sort(
            (a, b) =>
                b.score - a.score
        )
        .map(
            result =>
                result.product
        );
}


function loadSearchPage() {
    const resultsContainer =
        document.getElementById(
            'searchResults'
        );

    if (!resultsContainer) {
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const query =
        (
            params.get('q') ||
            ''
        ).trim();

    const input =
        document.getElementById(
            'searchInput'
        );

    const queryElement =
        document.getElementById(
            'searchQuery'
        );

    const noResults =
        document.getElementById(
            'noResults'
        );

    if (input) {
        input.value =
            query;
    }

    if (queryElement) {
        queryElement.textContent =
            query;
    }

    if (!query) {

        const products =
            getProducts().filter(
                product =>
                    product &&
                    product.is_active === true
            );

        resultsContainer.innerHTML =
            products.length
                ? products
                    .map(
                        createProductCard
                    )
                    .join('')
                : '';

        hideSearchNoResults(
            noResults
        );

        refreshScrollAnimations();

        return;
    }

    const results =
        searchProducts(
            query
        );

    if (results.length > 0) {

        resultsContainer.innerHTML =
            results
                .map(
                    createProductCard
                )
                .join('');

        hideSearchNoResults(
            noResults
        );

    } else {

        resultsContainer.innerHTML =
            '';

        showSearchNoResults(
            noResults,
            query
        );
    }

    refreshScrollAnimations();
}


function showSearchNoResults(
    noResults,
    query
) {
    if (!noResults) {
        return;
    }

    noResults.style.display =
        'flex';

    noResults.innerHTML = `
        <div class="no-results-icon">
            ${getSearchMinusIconSvg()}
        </div>

        <h2>
            ${escapeHtml(
                t(
                    'search.no_results',
                    currentLang === 'id'
                        ? 'Produk tidak ditemukan'
                        : 'No products found'
                )
            )}
        </h2>

        <p>
            ${escapeHtml(
                currentLang === 'id'
                    ? `Tidak ada produk yang cocok dengan "${query}". Coba kata kunci lain atau lihat semua produk.`
                    : `No products match "${query}". Try another keyword or browse all products.`
            )}
        </p>

        <button
            type="button"
            class="btn-buy search-browse-all"
            onclick="browseAllProducts()"
        >
            ${getGridIconSvg()}
            <span>
                ${escapeHtml(
                    currentLang === 'id'
                        ? 'Lihat Semua Produk'
                        : 'Browse All Products'
                )}
            </span>
        </button>
    `;
}


function hideSearchNoResults(
    noResults
) {
    if (!noResults) {
        return;
    }

    noResults.style.display =
        'none';
}


function browseAllProducts() {
    window.location.href =
        'index.html#all-products';
}


function setupEventListeners() {

    const searchInput =
        document.getElementById(
            'searchInput'
        );

    if (searchInput) {

        if (
            searchInput.dataset.searchBound !==
            'true'
        ) {
            searchInput.dataset.searchBound =
                'true';

            searchInput.addEventListener(
                'keydown',
                function (event) {

                    if (
                        event.key ===
                        'Enter'
                    ) {
                        event.preventDefault();

                        performSearch(
                            this.value
                        );
                    }
                }
            );
        }
    }

    const searchButton =
        document.getElementById(
            'searchButton'
        );

    if (searchButton) {

        if (
            searchButton.dataset.searchBound !==
            'true'
        ) {
            searchButton.dataset.searchBound =
                'true';

            searchButton.addEventListener(
                'click',
                function () {
                    performSearch(
                        searchInput
                            ? searchInput.value
                            : ''
                    );
                }
            );
        }
    }

    const menuToggle =
        document.getElementById(
            'mobileMenuToggle'
        );

    if (menuToggle) {

        if (
            menuToggle.dataset.menuBound !==
            'true'
        ) {
            menuToggle.dataset.menuBound =
                'true';

            menuToggle.addEventListener(
                'click',
                toggleMobileMenu
            );
        }
    }

    if (
        document.documentElement.dataset
            .mobileOutsideBound !== 'true'
    ) {
        document.documentElement.dataset
            .mobileOutsideBound = 'true';

        document.addEventListener(
            'click',
            function (event) {

                const nav =
                    document.getElementById(
                        'mobileNav'
                    );

                const toggle =
                    document.getElementById(
                        'mobileMenuToggle'
                    );

                if (
                    !nav ||
                    !toggle
                ) {
                    return;
                }

                if (
                    nav.classList.contains(
                        'hidden'
                    )
                ) {
                    return;
                }

                if (
                    !nav.contains(
                        event.target
                    ) &&
                    !toggle.contains(
                        event.target
                    )
                ) {
                    nav.classList.add(
                        'hidden'
                    );

                    toggle.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }
            }
        );
    }
}


function performSearch(query) {
    if (
        typeof query !==
        'string'
    ) {
        const input =
            document.getElementById(
                'searchInput'
            );

        query =
            input?.value || '';
    }

    query =
        query.trim();

    if (!query) {
        return;
    }

    window.location.href =
        `search.html?q=${encodeURIComponent(
            query
        )}`;
}


/* ============================================
   SHARING
   ============================================ */

function shareProduct(id) {
    const resolvedId =
        id ??
        new URLSearchParams(
            window.location.search
        ).get('id');

    const product =
        getProductById(
            resolvedId
        );

    if (!product) {
        return;
    }

    const url =
        buildProductUrl(
            product.id
        );

    const text =
        `${product.name} - ${formatPrice(
            product.price
        )}`;

    if (
        typeof navigator.share ===
        'function'
    ) {
        navigator
            .share({
                title:
                    product.name ||
                    'Market Flow',
                text,
                url
            })
            .catch(() => {});

        return;
    }

    copyToClipboard(
        url
    );
}


function shareTo(
    platform,
    id
) {
    const product =
        getProductById(id);

    if (!product) {
        return;
    }

    const url =
        buildProductUrl(
            product.id
        );

    const encodedUrl =
        encodeURIComponent(
            url
        );

    const text =
        encodeURIComponent(
            `${product.name} - ${formatPrice(
                product.price
            )}`
        );

    let shareUrl = '';

    switch (platform) {

        case 'whatsapp':

            shareUrl =
                `https://wa.me/?text=${text}%20${encodedUrl}`;

            break;

        case 'telegram':

            shareUrl =
                `https://t.me/share/url?url=${encodedUrl}&text=${text}`;

            break;

        case 'facebook':

            shareUrl =
                `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

            break;

        case 'twitter':
        case 'x':

            shareUrl =
                `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;

            break;

        default:
            return;
    }

    window.open(
        shareUrl,
        '_blank',
        'width=600,height=500,noopener,noreferrer'
    );
}


function copyToClipboard(text) {
    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {
        navigator.clipboard
            .writeText(text)
            .then(() => {

                showToast(
                    t(
                        'common.link_copied',
                        'Link copied to clipboard!'
                    ),
                    'success'
                );

            })
            .catch(() => {

                fallbackCopyToClipboard(
                    text
                );

            });

        return;
    }

    fallbackCopyToClipboard(
        text
    );
}


function fallbackCopyToClipboard(text) {
    const input =
        document.createElement(
            'input'
        );

    input.value =
        text;

    input.setAttribute(
        'readonly',
        ''
    );

    input.style.position =
        'fixed';

    input.style.opacity =
        '0';

    input.style.pointerEvents =
        'none';

    document.body.appendChild(
        input
    );

    input.select();

    input.setSelectionRange(
        0,
        input.value.length
    );

    let copied = false;

    try {
        copied =
            document.execCommand(
                'copy'
            );
    } catch (error) {
        copied = false;
    }

    document.body.removeChild(
        input
    );

    if (copied) {

        showToast(
            t(
                'common.link_copied',
                'Link copied to clipboard!'
            ),
            'success'
        );

    } else {

        showToast(
            t(
                'common.copy_failed',
                'Unable to copy the link.'
            ),
            'error'
        );

    }
}


/* ============================================
   ANALYTICS
   ============================================ */

function trackView(
    productId
) {
    const products =
        getProducts();

    const product =
        products.find(
            item =>
                sameId(
                    item?.id,
                    productId
                )
        );

    if (!product) {
        return false;
    }

    product.views =
        getSafeNumber(
            product.views
        ) + 1;

    const saved =
        writeStorage(
            STORAGE_KEYS.products,
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


function trackClick(
    productId
) {
    const products =
        getProducts();

    const product =
        products.find(
            item =>
                sameId(
                    item?.id,
                    productId
                )
        );

    if (!product) {
        return false;
    }

    product.clicks =
        getSafeNumber(
            product.clicks
        ) + 1;

    const saved =
        writeStorage(
            STORAGE_KEYS.products,
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


function addActivity(
    productId,
    productName,
    type
) {
    const activities =
        getActivities();

    const normalizedType =
        type === 'click'
            ? 'click'
            : 'view';

    activities.push({
        product_id:
            productId,

        product_name:
            String(
                productName || ''
            ),

        type:
            normalizedType,

        timestamp:
            new Date().toISOString()
    });

    const trimmed =
        activities.length > 1000
            ? activities.slice(
                -1000
            )
            : activities;

    return writeStorage(
        STORAGE_KEYS.activities,
        trimmed
    );
}


/* ============================================
   PRODUCT DETAIL PAGE
   ============================================ */

function getProductFromUrl() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get('id');

    if (!id) {
        return null;
    }

    return getProductById(id);
}


function loadProduct(
    trackCurrentView = false
) {
    const product =
        getProductFromUrl();

    const detail =
        document.querySelector(
            '.product-detail'
        );

    if (!detail) {
        return;
    }

    if (!product) {

        detail.innerHTML = `
            <div class="container">

                <div class="empty-state">

                    <div class="empty-state-icon">
                        ${getSearchIconSvg()}
                    </div>

                    <h2>
                        ${escapeHtml(
                            t(
                                'search.no_results',
                                'Product not found'
                            )
                        )}
                    </h2>

                    <p>
                        ${escapeHtml(
                            t(
                                'search.try_different',
                                'Please return to the catalogue and choose a product.'
                            )
                        )}
                    </p>

                </div>

            </div>
        `;

        return;
    }

    if (
        trackCurrentView &&
        !productDetailViewTracked
    ) {

        trackView(
            product.id
        );

        productDetailViewTracked =
            true;

        const refreshed =
            getProductById(
                product.id
            );

        if (refreshed) {
            product.views =
                refreshed.views;
        }
    }

    const categories =
        getCategories();

    const category =
        categories.find(
            item =>
                sameId(
                    item?.id,
                    product.category_id
                )
        );

    const categoryName =
        category
            ? (
                currentLang === 'id'
                    ? category.name_id
                    : category.name_en
            )
            : '';

    const image =
        document.getElementById(
            'productImage'
        );

    if (image) {

        image.src =
            product.image ||
            PLACEHOLDER_IMAGE;

        image.alt =
            product.name || '';

        image.onerror =
            function () {

                this.onerror =
                    null;

                this.src =
                    PLACEHOLDER_IMAGE;
            };
    }

    setElementText(
        '#productCategory',
        categoryName
    );

    setElementText(
        '#productName',
        product.name || ''
    );

    setElementText(
        '#productPrice',
        formatPrice(
            product.price
        )
    );

    setElementText(
        '#productViews',
        getSafeNumber(
            product.views
        )
    );

    setElementText(
        '#productDescription',
        product.description || '—'
    );

    const buyButton =
        document.getElementById(
            'buyButton'
        );

    if (buyButton) {

        if (
            product.shopee_link
        ) {

            buyButton.href =
                product.shopee_link;

            buyButton.target =
                '_blank';

            buyButton.rel =
                'noopener noreferrer';

            buyButton.onclick =
                function () {
                    trackClick(
                        product.id
                    );
                };

            buyButton.removeAttribute(
                'aria-disabled'
            );

        } else {

            buyButton.href =
                '#';

            buyButton.removeAttribute(
                'target'
            );

            buyButton.removeAttribute(
                'rel'
            );

            buyButton.setAttribute(
                'aria-disabled',
                'true'
            );

            buyButton.onclick =
                function (event) {

                    event.preventDefault();

                    showToast(
                        t(
                            'common.link_unavailable',
                            'Product link is unavailable.'
                        ),
                        'error'
                    );
                };
        }
    }

    const badge =
        document.getElementById(
            'productBadge'
        );

    if (badge) {
        badge.hidden =
            product.is_featured !== true;
    }

    document.title =
        `${product.name || 'Product'} — Market Flow`;

    showRelatedProducts(
        product
    );
}


function showRelatedProducts(
    product
) {
    const container =
        document.getElementById(
            'relatedProducts'
        );

    if (
        !container ||
        !product
    ) {
        return;
    }

    const products =
        getProducts();

    const related =
        products
            .filter(
                item =>
                    item &&
                    item.is_active === true &&
                    !sameId(
                        item.id,
                        product.id
                    ) &&
                    sameId(
                        item.category_id,
                        product.category_id
                    )
            )
            .slice(0, 6);

    if (
        related.length === 0
    ) {

        container.innerHTML = `
            <p class="no-products">
                ${escapeHtml(
                    t(
                        'products.no_related',
                        'No related products yet.'
                    )
                )}
            </p>
        `;

        return;
    }

    container.innerHTML =
        related
            .map(
                createProductCard
            )
            .join('');

    refreshScrollAnimations();
}


/* ============================================
   PRODUCT DETAIL SHARE BUTTONS
   ============================================ */

function shareToWhatsApp() {
    const product =
        getProductFromUrl();

    if (product) {
        shareTo(
            'whatsapp',
            product.id
        );
    }
}


function shareToTelegram() {
    const product =
        getProductFromUrl();

    if (product) {
        shareTo(
            'telegram',
            product.id
        );
    }
}


function shareToFacebook() {
    const product =
        getProductFromUrl();

    if (product) {
        shareTo(
            'facebook',
            product.id
        );
    }
}


function shareToTwitter() {
    const product =
        getProductFromUrl();

    if (product) {
        shareTo(
            'twitter',
            product.id
        );
    }
}


function copyLink() {
    const product =
        getProductFromUrl();

    if (!product) {
        return;
    }

    copyToClipboard(
        buildProductUrl(
            product.id
        )
    );
}


/* ============================================
   URL HELPERS
   ============================================ */

function buildProductUrl(
    productId
) {
    const basePath =
        getCurrentDirectory();

    return (
        `${window.location.origin}` +
        `${basePath}product.html?id=` +
        `${encodeURIComponent(
            productId
        )}`
    );
}


function buildCategoryUrl(
    categoryId
) {
    const basePath =
        getCurrentDirectory();

    return (
        `${window.location.origin}` +
        `${basePath}category.html?id=` +
        `${encodeURIComponent(
            categoryId
        )}`
    );
}


function getCurrentDirectory() {
    const pathname =
        window.location.pathname;

    return pathname.replace(
        /[^/]*$/,
        ''
    );
}


/* ============================================
   MOBILE MENU
   ============================================ */

function toggleMobileMenu() {
    const nav =
        document.getElementById(
            'mobileNav'
        );

    if (!nav) {
        return;
    }

    nav.classList.toggle(
        'hidden'
    );

    const toggle =
        document.getElementById(
            'mobileMenuToggle'
        );

    if (toggle) {

        const isOpen =
            !nav.classList.contains(
                'hidden'
            );

        toggle.setAttribute(
            'aria-expanded',
            isOpen
                ? 'true'
                : 'false'
        );
    }
}


/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */

function showToast(
    message,
    type = 'success'
) {
    const existing =
        document.querySelector(
            '.toast'
        );

    if (existing) {
        existing.remove();
    }

    const toast =
        document.createElement(
            'div'
        );

    toast.className =
        `toast ${type}`;

    const icon =
        type === 'success'
            ? getCheckIconSvg()
            : getErrorIconSvg();

    toast.innerHTML = `
        <span class="toast-icon">
            ${icon}
        </span>

        <span>
            ${escapeHtml(
                message
            )}
        </span>
    `;

    document.body.appendChild(
        toast
    );

    requestAnimationFrame(
        () => {
            toast.classList.add(
                'show'
            );
        }
    );

    window.setTimeout(
        () => {

            toast.classList.remove(
                'show'
            );

            window.setTimeout(
                () => {

                    if (
                        toast.parentNode
                    ) {
                        toast.remove();
                    }

                },
                300
            );

        },
        3000
    );
}


/* ============================================
   SCROLL ANIMATIONS
   ============================================ */

function initScrollAnimations() {

    if (
        scrollAnimationObserver
    ) {
        scrollAnimationObserver.disconnect();
        scrollAnimationObserver = null;
    }

    const elements =
        document.querySelectorAll(
            [
                '.product-card',
                '.category-item',
                '.section-title',
                '.about-section'
            ].join(', ')
        );

    if (!elements.length) {
        return;
    }

    if (
        !(
            'IntersectionObserver'
            in window
        )
    ) {

        elements.forEach(
            element => {
                element.classList.add(
                    'visible'
                );
            }
        );

        return;
    }

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                'visible'
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    }
                );
            },
            {
                threshold: 0.1
            }
        );

    scrollAnimationObserver =
        observer;

    elements.forEach(
        (element, index) => {

            element.classList.add(
                'scroll-reveal'
            );

            element.style.transitionDelay =
                `${(
                    index % 10
                ) * 0.05}s`;

            observer.observe(
                element
            );
        }
    );
}


function refreshScrollAnimations() {
    window.requestAnimationFrame(
        () => {
            initScrollAnimations();
        }
    );
}


/* ============================================
   SAMPLE DATA
   ============================================ */

function initializeSampleData() {

    let initialized = null;

    try {
        initialized =
            localStorage.getItem(
                STORAGE_KEYS.initialized
            );
    } catch (error) {
        console.error(
            'Failed to read initialization state:',
            error
        );
    }

    if (
        initialized === 'true'
    ) {
        return;
    }

    const existingProducts =
        getProducts();

    const existingCategories =
        getCategories();

    const existingActivities =
        getActivities();

    if (
        existingCategories.length === 0
    ) {

        const createdAt =
            new Date().toISOString();

        const sampleCategories = [
            {
                id: 1,
                name_en: 'Gadgets',
                name_id: 'Gadget',
                icon: '📱',
                is_active: true,
                created_at:
                    createdAt
            },
            {
                id: 2,
                name_en: 'Fashion',
                name_id: 'Fashion',
                icon: '👕',
                is_active: true,
                created_at:
                    createdAt
            },
            {
                id: 3,
                name_en: 'Home & Living',
                name_id:
                    'Rumah & Living',
                icon: '🏠',
                is_active: true,
                created_at:
                    createdAt
            },
            {
                id: 4,
                name_en: 'Beauty',
                name_id: 'Kecantikan',
                icon: '💄',
                is_active: true,
                created_at:
                    createdAt
            },
            {
                id: 5,
                name_en: 'Gaming',
                name_id: 'Gaming',
                icon: '🎮',
                is_active: true,
                created_at:
                    createdAt
            }
        ];

        writeStorage(
            STORAGE_KEYS.categories,
            sampleCategories
        );
    }

    if (
        existingProducts.length === 0
    ) {

        const createdAt =
            new Date().toISOString();

        const sampleProducts = [
            {
                id: 1,
                name:
                    'Wireless Earbuds Pro',
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
                created_at:
                    createdAt
            },

            {
                id: 2,
                name:
                    'Smart Watch Series 5',
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
                created_at:
                    createdAt
            },

            {
                id: 3,
                name:
                    'Gaming Mechanical Keyboard RGB',
                price: 450000,
                category_id: 5,
                image:
                    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400',
                shopee_link:
                    'https://shopee.co.id/product/3',
                description:
                    'Premium mechanical keyboard with RGB lighting.',
                is_featured: true,
                is_active: true,
                views: 0,
                clicks: 0,
                created_at:
                    createdAt
            },

            {
                id: 4,
                name:
                    'Minimalist T-Shirt',
                price: 85000,
                category_id: 2,
                image:
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                shopee_link:
                    'https://shopee.co.id/product/4',
                description:
                    'Comfortable cotton t-shirt with minimalist design.',
                is_featured: false,
                is_active: true,
                views: 0,
                clicks: 0,
                created_at:
                    createdAt
            },

            {
                id: 5,
                name:
                    'LED Strip Lights 5m',
                price: 120000,
                category_id: 3,
                image:
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
                shopee_link:
                    'https://shopee.co.id/product/5',
                description:
                    'Colorful LED strip lights with remote control.',
                is_featured: false,
                is_active: true,
                views: 0,
                clicks: 0,
                created_at:
                    createdAt
            }
        ];

        writeStorage(
            STORAGE_KEYS.products,
            sampleProducts
        );
    }

    if (
        existingActivities.length === 0
    ) {

        writeStorage(
            STORAGE_KEYS.activities,
            []
        );
    }

    try {

        localStorage.setItem(
            STORAGE_KEYS.initialized,
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
   DOM HELPERS
   ============================================ */

function setElementText(
    selector,
    value
) {
    const element =
        document.querySelector(
            selector
        );

    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
        value === undefined
            ? ''
            : String(value);
}


/* ============================================
   SVG ICON HELPERS
   ============================================ */

function getSvgIcon(
    content,
    size = 20,
    className = ''
) {
    return `
        <svg
            class="${escapeHtml(className)}"
            width="${size}"
            height="${size}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            ${content}
        </svg>
    `;
}


function getCartIconSvg() {
    return getSvgIcon(
        `
            <circle cx="9" cy="20" r="1"></circle>
            <circle cx="19" cy="20" r="1"></circle>
            <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"></path>
        `,
        18
    );
}


function getShareIconSvg() {
    return getSvgIcon(
        `
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <path d="m8.6 13.5 6.8 4"></path>
            <path d="m15.4 6.5-6.8 4"></path>
        `,
        18
    );
}


function getSearchIconSvg() {
    return getSvgIcon(
        `
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        `,
        48
    );
}


function getSearchMinusIconSvg() {
    return getSvgIcon(
        `
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
            <path d="M8 11h6"></path>
        `,
        64
    );
}


function getPackageIconSvg() {
    return getSvgIcon(
        `
            <path d="m16.5 9.4-9-5.19"></path>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
            <path d="M3.27 6.96 12 12.01l8.73-5.05"></path>
            <path d="M12 22.08V12"></path>
        `,
        48
    );
}


function getGridIconSvg() {
    return getSvgIcon(
        `
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        `,
        18
    );
}


function getCheckIconSvg() {
    return getSvgIcon(
        `
            <circle cx="12" cy="12" r="9"></circle>
            <path d="m8 12 2.5 2.5L16 9"></path>
        `,
        18
    );
}


function getErrorIconSvg() {
    return getSvgIcon(
        `
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 8v5"></path>
            <path d="M12 16h.01"></path>
        `,
        18
    );
}


function renderCategoryIcon(
    icon
) {
    const value =
        String(
            icon || ''
        ).trim();

    if (
        value.startsWith('<svg')
    ) {
        return value;
    }

    const iconMap = {
        '📱': `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="6" y="2.5" width="12" height="19" rx="2.5"></rect>
                <path d="M10 18.5h4"></path>
            </svg>
        `,

        '👕': `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m8 4 4 2 4-2 4 3-2 4-2-1v11H8V10l-2 1-2-4 4-3Z"></path>
            </svg>
        `,

        '🏠': `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m3 10 9-7 9 7"></path>
                <path d="M5 9v11h14V9"></path>
                <path d="M9 20v-6h6v6"></path>
            </svg>
        `,

        '💄': `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 3h8"></path>
                <path d="M10 3v6l-3 3v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8l-3-3V3"></path>
                <path d="M7 12h10"></path>
            </svg>
        `,

        '🎮': `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 8h10a4 4 0 0 1 3.8 5.3l-1.2 4a2.5 2.5 0 0 1-4.4.8L14 16H10l-1.2 2.1a2.5 2.5 0 0 1-4.4-.8l-1.2-4A4 4 0 0 1 7 8Z"></path>
                <path d="M8 11v4"></path>
                <path d="M6 13h4"></path>
                <path d="M16 12h.01"></path>
                <path d="M18 14h.01"></path>
            </svg>
        `,

        '📦':
            getPackageIconSvg(
                30
            )
    };

    if (
        Object.prototype.hasOwnProperty.call(
            iconMap,
            value
        )
    ) {
        return iconMap[value];
    }

    return escapeHtml(
        value || '📦'
    );
}


/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

function sameId(
    a,
    b
) {
    if (
        a === null ||
        a === undefined ||
        b === null ||
        b === undefined
    ) {
        return false;
    }

    return (
        String(a) ===
        String(b)
    );
}


function getSafeNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


function formatPrice(
    price
) {
    const numericPrice =
        Number(price);

    if (
        !Number.isFinite(
            numericPrice
        )
    ) {
        return 'Rp 0';
    }

    return (
        'Rp ' +
        Math.round(
            numericPrice
        ).toLocaleString(
            'id-ID'
        )
    );
}


function escapeHtml(
    value
) {
    return String(
        value ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}
