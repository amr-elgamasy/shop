// نظام عرض الإشعارات
function showCartNotification(message) {
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// متغيرات النظام الأساسية
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = 1;
const productsPerPage = 9;
let allProducts = [];
let filteredProducts = [];
let activeFilters = {
    category: 'all',
    animal: 'all',
    price: 500,
    search: ''
};

// وظيفة تحديث السلة
function updateCart() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total span');
    const cartCount = document.querySelector('.cart-count');

    cartItems.innerHTML = '';
    let total = 0;
    let totalItems = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-total">${itemTotal.toLocaleString('ar-EG')} ج.م</span>
            </div>
            <span class="item-id">رقم المنتج: ${item.id}</span>
            <div class="quantity-controls">
                    <button class="decrease-qty" data-index="${index}">−</button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="increase-qty" data-index="${index}">+</button>
                    <button class="remove-item" data-index="${index}">🗑️</button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = total.toLocaleString('ar-EG') + " ج.م";
    cartCount.textContent = totalItems;

    if (totalItems > 0) {
        cartCount.classList.add('visible', 'bounce');
        setTimeout(() => cartCount.classList.remove('bounce'), 500);
    } else {
        cartCount.classList.remove('visible');
    }

    localStorage.setItem('cart', JSON.stringify(cart));
}

// جلب المنتجات من Google Sheets
async function fetchProductsFromSheet() {
    const sheetUrl = "https://opensheet.elk.sh/1_c9SATiQVFTxXAEXFEmLR2NpRUorcVwc3vaiKJ90CI4/sheet1";
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productsContainer = document.getElementById('productsContainer');

    loadingSpinner.classList.add('active');
    productsContainer.style.display = 'none';

    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات من السيرفر');
        }

        const data = await response.json();
        console.log('تم استلام البيانات:', data);
        
        if (!Array.isArray(data)) {
            throw new Error('البيانات المستلمة غير صالحة');
        }

        allProducts = data.map(product => ({
            id: product.id || '',
            name: product.name || '',
            description: product.description || '',
            category: product.category || '',
            animal: product.animal || '',
            price: parseInt(product.price) || 0,
            priceout: product.priceout || '',
            quantity: parseInt(product.quantity) || 0,
            image: product.image || 'images/placeholder.jpg'
        }));

        filteredProducts = [...allProducts];

        if (allProducts.length > 0) {
            applyFilters();
            loadingSpinner.classList.remove('active');
            productsContainer.style.display = 'grid';
        } else {
            throw new Error('لم يتم تحميل أي منتجات');
        }

    } catch (error) {
        console.error('حدث خطأ في معالجة البيانات:', error);
        showCartNotification(`خطأ: ${error.message}`);
        loadingSpinner.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>${error.message}</p>
        `;
    }
}

// تطبيق الفلاتر والبحث
function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        // تطبيق فلتر البحث
        const matchesSearch = product.name.toLowerCase().includes(activeFilters.search.toLowerCase());
        
        // تطبيق فلتر الفئة
        const matchesCategory = activeFilters.category === 'all' || 
                               product.category === activeFilters.category;
        
        // تطبيق فلتر نوع الحيوان
        const matchesAnimal = activeFilters.animal === 'all' || 
                              product.animal === activeFilters.animal;
        
        // تطبيق فلتر السعر
        const matchesPrice = product.price <= activeFilters.price;
        
        return matchesSearch && matchesCategory && matchesAnimal && matchesPrice;
    });

    displayProducts(1);
}

// نظام عرض المنتجات والصفحات
function displayProducts(page) {
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = '';

    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="color: var(--primary-color); font-size: 2rem; margin-bottom: var(--spacing-md);"></i>
                <p>لا توجد نتائج مطابقة لبحثك</p>
            </div>`;
        document.getElementById('pageNumbers').innerHTML = '';
        return;
    }

    paginatedProducts.forEach(product => {
        const productHTML = `
        <div class="product-row" data-id="${product.id}" data-title="${product.name}" data-category="${product.category}" data-animal="${product.animal}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="product-details">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span class="animal-type">${product.animal}</span>
                    <span class="product-category">${product.category}</span>
                </div>
                <div class="product-quantity">
                    <span class="product-quantity ${product.quantity === 0 ? 'out-of-stock' : ''}">
                        ${product.quantity === 0 ? 'غير متوفر الآن' : `الكمية المتاحة: ${product.quantity}`}
                    </span>
                </div>
            </div>
            <div class="product-pricing">
                <span class="old-price">${product.priceout}</span>
                <div class="price-container">
                    <span class="current-price">${product.price} ج.م</span>
                </div>
                <button class="add-to-cart" ${product.quantity === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i>
                    ${product.quantity === 0 ? 'غير متوفر' : 'إضافة للسلة'}
                </button>
            </div>
        </div>`;
        productsContainer.innerHTML += productHTML;
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            displayProducts(currentPage);
        };
        pageNumbers.appendChild(pageBtn);
    }

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// إعداد الأحداث
document.addEventListener('DOMContentLoaded', function() {
    fetchProductsFromSheet();
    updateCart();

    // Mobile filter toggle functionality
    const mobileFilterBtn = document.querySelector('.mobile-filter-btn');
    const closeFilterBtn = document.querySelector('.close-filter');
    const filterSidebar = document.querySelector('.filter-sidebar');
    
    mobileFilterBtn.addEventListener('click', function() {
        filterSidebar.classList.add('active');
    });
    
    closeFilterBtn.addEventListener('click', function() {
        filterSidebar.classList.remove('active');
    });
    
    // Handle category filter (radio button behavior)
    const categoryFilters = document.querySelectorAll('.filter-group:nth-child(1) input[type="checkbox"]');
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck other category filters
                categoryFilters.forEach(f => {
                    if (f !== this) f.checked = false;
                });
                
                // Update active filter
                if (this.nextElementSibling.textContent === 'جميع الفئات') {
                    activeFilters.category = 'all';
                } else {
                    activeFilters.category = this.nextElementSibling.textContent;
                }
                
                applyFilters();
            } else {
                // Prevent unchecking the last checked filter
                this.checked = true;
            }
        });
    });
    
    // Handle animal type filter (radio button behavior)
    const animalFilters = document.querySelectorAll('.filter-group:nth-child(2) input[type="checkbox"]');
    animalFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            if (this.checked) {
                // Uncheck other animal filters
                animalFilters.forEach(f => {
                    if (f !== this) f.checked = false;
                });
                
                // Update active filter
                if (this.nextElementSibling.textContent === 'الكل') {
                    activeFilters.animal = 'all';
                } else {
                    activeFilters.animal = this.nextElementSibling.textContent;
                }
                
                applyFilters();
            } else {
                // Prevent unchecking the last checked filter
                this.checked = true;
            }
        });
    });
    
    // Price range filter
    const priceSlider = document.querySelector('.price-slider');
    if (priceSlider) {
        priceSlider.addEventListener('input', function() {
            activeFilters.price = parseInt(this.value);
            applyFilters();
        });
    }
    
    // Reset all filters
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Reset checkboxes
            document.querySelectorAll('.filter-options input[type="checkbox"]').forEach((checkbox, index) => {
                checkbox.checked = index === 0 || index === categoryFilters.length;
            });
            
            // Reset price slider
            if (priceSlider) {
                priceSlider.value = priceSlider.max;
                activeFilters.price = parseInt(priceSlider.max);
            }
            
            // Reset search
            document.getElementById('searchInput').value = '';
            activeFilters.search = '';
            
            // Reset active filters
            activeFilters = {
                category: 'all',
                animal: 'all',
                price: parseInt(priceSlider.max),
                search: ''
            };
            
            applyFilters();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            activeFilters.search = this.value;
            applyFilters();
        });
    }

    // Cart functionality
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');

    document.getElementById('cart-button').addEventListener('click', () => {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when cart is open
    });

    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('visible');
        document.body.style.overflow = ''; // Restore scrolling
    }

    document.getElementById('close-cart').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    document.getElementById('checkoutBtn').addEventListener('click', function () {
        if (cart.length === 0) {
            showCartNotification('السلة فارغة. الرجاء إضافة منتجات أولاً.');
            return;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.location.href = 'check/checkout.html';
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayProducts(currentPage);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayProducts(currentPage);
        }
    });
});

// معالجة أحداث النقر
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('increase-qty')) {
        const index = parseInt(e.target.dataset.index);
        const cartItem = cart[index];
        
        // البحث عن المنتج في قائمة المنتجات للتحقق من الكمية المتاحة
        const product = allProducts.find(p => p.id === cartItem.id);
        if (!product) return;

        const requestedQuantity = cartItem.quantity + 1;
        
        if (requestedQuantity > product.quantity) {
            showCartNotification('عذراً، الكمية المطلوبة غير متوفرة في المخزون');
            return;
        }

        if (requestedQuantity > 5) {
            showCartNotification('عذراً، لا يمكن طلب أكثر من 5 قطع من نفس المنتج');
            return;
        }

        cart[index].quantity = requestedQuantity;
        updateCart();
    }

    if (e.target.classList.contains('decrease-qty')) {
        const index = parseInt(e.target.dataset.index);
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        updateCart();
    }

    if (e.target.classList.contains('remove-item')) {
        const index = parseInt(e.target.dataset.index);
        cart.splice(index, 1);
        updateCart();
    }

    if (e.target.classList.contains('add-to-cart') && !e.target.disabled) {
    const productCard = e.target.closest('.product-row');
    if (productCard) {
        const productId = productCard.getAttribute('data-id');
        const product = filteredProducts.find(p => p.id === productId);

        if (!product) return;

        // التحقق من الكمية المتاحة
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            const newQuantity = existingItem.quantity + 1;

            if (newQuantity > product.quantity) {
                showCartNotification('عذراً، الكمية المطلوبة غير متوفرة في المخزون');
                return;
            }

            if (newQuantity > 5) {
                showCartNotification('عذراً، لا يمكن طلب أكثر من 5 قطع من نفس المنتج');
                return;
            }

            existingItem.quantity = newQuantity;
        } else {
            if (product.quantity < 1) {
                showCartNotification('عذراً، هذا المنتج غير متوفر حالياً');
                return;
            }

            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }

        updateCart();
        showCartNotification('تمت إضافة المنتج إلى السلة');
    }
}

});