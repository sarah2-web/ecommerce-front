// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.innerHTML = navMenu.classList.contains('active')
            ? '<i class="fas fa-xmark"></i>'
            : '<i class="fas fa-bars"></i>';
    });
}

// Smooth Scroll + Active Link
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');

        // لو الرابط بيبدأ بـ # → Scroll داخل الصفحة
        if (targetId.startsWith('#')) {
            e.preventDefault();

            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        // غير كده (زي admin.html) → سيبه يفتح الصفحة طبيعي

        // Active class
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        // اقفل المينيو في الموبايل بعد الضغط
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
});

// Scroll Effects for Navbar
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.15)';
        navbar.style.backdropFilter = 'blur(12px)';
        navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.2)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.1)';
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.boxShadow = 'none';
    }
});

// Search Functionality
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log(`Searching for: ${searchTerm}`);
            searchInput.value = '';
        }
    });
}

// Add to Cart Animation
// ==========================================
// إعدادات API
// ==========================================
const API_BASE = 'http://127.0.0.1:8000/api';

// ==========================================
// دوال المساعدة
// ==========================================
function getToken() {
    return localStorage.getItem('access_token') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('access_token');
}

function getHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Requested-With': 'XMLHttpRequest'
    };
}

function notify(message, isError = false) {
    if (isError) {
        console.error('❌', message);
        alert('خطأ: ' + message);
    } else {
        console.log('✅', message);
        alert(message);
    }
}

// ==========================================
// تهيئة عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    const cartIcon = document.getElementById('cartIcon');
    const cartDropdown = document.getElementById('cartDropdown');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCart');
    const cartItemsUl = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.querySelector('.checkout-btn');

    let productGrid = null;

    // ==========================================
    // تحميل المنتجات من API
    // ==========================================
    async function loadProducts() {
        productGrid = document.querySelector('.product-grid');
        if (!productGrid) {
            console.error('❌ product-grid غير موجود');
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error(`خطأ ${res.status}`);
            
            const products = await res.json();
            console.log('📦 المنتجات المستلمة:', products);

            productGrid.innerHTML = '';
            
            if (!products || products.length === 0) {
                productGrid.innerHTML = '<p>لا توجد منتجات</p>';
                return;
            }

            products.forEach(product => {
                console.log('🛠️ إنشاء منتج:', product.p_id || product.id, product.name);
                
                const div = document.createElement('div');
                div.classList.add('product-card');
                
                const badgeHtml = product.is_new ? `<span class="badge">NEW</span>` : '';

                // ✅ استخدم p-id زي الجدول
                div.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image || 'placeholder.jpg'}" alt="${product.name}">
                        ${badgeHtml}
                    </div>
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price}</p>
                    <button class="add-to-cart" p-id="${product.p_id || product.id}">
                        Add to Cart
                    </button>
                `;

                productGrid.appendChild(div);
            });
            
            console.log('✅ تم تحميل المنتجات:', products.length);
            
            attachCartEvents();
            
        } catch (err) {
            console.error('❌ Error fetching products:', err);
            if (productGrid) {
                productGrid.innerHTML = '<p>فشل تحميل المنتجات</p>';
            }
        }
    }

    // ==========================================
    // ربط أحداث السلة
    // ==========================================
    function attachCartEvents() {
        if (!productGrid) return;
        
        const newGrid = productGrid.cloneNode(true);
        productGrid.parentNode.replaceChild(newGrid, productGrid);
        productGrid = newGrid;
        
        productGrid.addEventListener('click', async (e) => {
            const button = e.target.closest('.add-to-cart');
            if (!button) return;
            
            // ✅ استخدم p-id
            const productId = button.getAttribute('p-id');
            
            console.log('🎯 p-id من الزر:', productId);
            console.log('🎯 attributes:', Array.from(button.attributes).map(a => `${a.name}=${a.value}`));

            if (!productId || productId === 'undefined' || productId.trim() === '') {
                console.error('❌ لم يتم العثور على p-id');
                notify('معرف المنتج غير موجود', true);
                return;
            }

            const numericId = parseInt(productId.trim(), 10);
            console.log('🎯 numericId:', numericId);

            if (isNaN(numericId) || numericId <= 0) {
                console.error('❌ معرف المنتج غير صالح:', productId);
                notify('معرف المنتج غير صالح', true);
                return;
            }

            try {
                console.log('📤 إرسال طلب إضافة:', { product_id: numericId });
                
                const res = await fetch(`${API_BASE}/order/add`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ product_id: numericId })
                });

                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await res.text();
                    console.error('❌ استجابة غير JSON:', text.substring(0, 200));
                    throw new Error(`استجابة غير صالحة من الخادم`);
                }

                const data = await res.json();
                console.log('📥 استجابة الخادم:', data);

                if (!res.ok) {
                    throw new Error(data.message || `خطأ ${res.status}`);
                }

                cartDropdown.classList.add('active');
                if (cartOverlay) cartOverlay.classList.add('active');
                await loadCart();
                notify(data.message || 'تمت إضافة المنتج بنجاح');
                
            } catch (err) {
                console.error('❌ Error adding to cart:', err);
                notify(err.message || 'فشل إضافة المنتج', true);
            }
        });
        
        console.log('✅ تم ربط أحداث السلة');
    }

    // ==========================================
    // دوال السلة
    // ==========================================
    async function loadCart() {
        const token = getToken();
        if (!token) {
            notify('يجب تسجيل الدخول أولاً', true);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/order/cart`, {
                headers: getHeaders()
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`استجابة غير صالحة: ${text.substring(0, 100)}`);
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            renderCartItems(data);
            updateCartUI(data);
            
        } catch (err) {
            console.error('❌ Error loading cart:', err);
            notify(err.message || 'فشل جلب السلة', true);
        }
    }

    function updateCartUI(cart) {
    const count = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    // ✅ تأكد إن total_price رقم
    let total = 0;
    if (cart.total_price !== undefined && cart.total_price !== null) {
        total = parseFloat(cart.total_price);
    }
    
    // ✅ لو parseFloat فشل، احسب من items
    if (isNaN(total) && cart.items) {
        total = cart.items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0);
    }
    
    if (cartCount) cartCount.innerText = count;
    if (cartTotal) cartTotal.innerText = `Total: $${total.toFixed(2)}`;
}
   

    function renderCartItems(cart) {
        if (!cartItemsUl) return;
        cartItemsUl.innerHTML = '';

        if (!cart.items || cart.items.length === 0) {
            cartItemsUl.innerHTML = '<li style="padding: 20px; text-align: center;">السلة فارغة</li>';
            return;
        }

        cart.items.forEach(item => {
            const li = document.createElement('li');
            li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;';
            
            li.innerHTML = `
                <div style="flex: 1;">
                    <strong>${item.product?.name || 'منتج'}</strong><br>
                    <small>$${item.item_price} × 
                        <input type="number" min="1" value="${item.quantity}" 
                               data-id="${item.id}" class="qty-input" style="width: 50px;">
                    </small>
                </div>
                <div>
                    <span>$${(item.item_price * item.quantity).toFixed(2)}</span>
                    <button class="remove-item" data-id="${item.id}" 
                            style="margin-right: 10px; background: #e74c3c; color: white; border: none; padding: 4px 8px; cursor: pointer;">
                        ×
                    </button>
                </div>
            `;
            cartItemsUl.appendChild(li);
        });
    }

    // ==========================================
    // أحداث السلة الأساسية
    // ==========================================
    
    if (cartIcon) {
        cartIcon.addEventListener('click', async () => {
            const isVisible = cartDropdown.classList.contains('active');
            
            if (isVisible) {
                cartDropdown.classList.remove('active');
                if (cartOverlay) cartOverlay.classList.remove('active');
            } else {
                cartDropdown.classList.add('active');
                if (cartOverlay) cartOverlay.classList.add('active');
                await loadCart();
            }
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartDropdown.classList.remove('active');
            if (cartOverlay) cartOverlay.classList.remove('active');
        });
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => {
            cartDropdown.classList.remove('active');
            cartOverlay.classList.remove('active');
        });
    }

    // حذف منتج
    if (cartItemsUl) {
        cartItemsUl.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('remove-item')) return;
            
            const itemId = e.target.dataset.id;
            if (!itemId) return;

            try {
                const res = await fetch(`${API_BASE}/order/cart/${itemId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                await loadCart();
                notify(data.message || 'تم الحذف');
            } catch (err) {
                notify(err.message || 'فشل الحذف', true);
            }
        });
    }

   
    // تعديل الكمية - بدون API
if (cartItemsUl) {
    cartItemsUl.addEventListener('change', async (e) => {
        if (!e.target.classList.contains('qty-input')) return;
        
        const itemId = e.target.dataset.id;
        const qty = parseInt(e.target.value);
        
        console.log('🎯 تغيير كمية:', itemId, qty);

        if (!itemId) return;
        
        if (qty < 1) {
            // احذف المنتج
            e.target.closest('li').querySelector('.remove-item')?.click();
            return;
        }

        // ✅ جرب أي route متاح
        try {
            // جرب POST أولاً
            const res = await fetch(`${API_BASE}/order/cart/update`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ 
                    item_id: itemId,
                    quantity: qty 
                })
            });

            if (!res.ok) throw new Error('فشل التحديث');
            
            const data = await res.json();
            await loadCart();
            notify(data.message || 'تم التحديث');
            
        } catch (err) {
            console.error('❌ خطأ:', err);
            notify('فشل التحديث', true);
            await loadCart(); // رجع القيم القديمة
        }
    });
}

    // إتمام الطلب
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (!confirm('هل تريد إتمام الطلب؟')) return;

            try {
                const res = await fetch(`${API_BASE}/order/checkout`, {
                    method: 'POST',
                    headers: getHeaders()
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                await loadCart();
                notify(data.message || 'تم إتمام الطلب');
            } catch (err) {
                notify(err.message || 'فشل إتمام الطلب', true);
            }
        });
    }

    // ==========================================
    // بدء التطبيق
    // ==========================================
    console.log('🚀 بدء تحميل التطبيق...');
    loadProducts();
    
    if (getToken()) {
        loadCart();
    }

});





// Form Submission
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        e.target.reset();
    });
}

// زر Sign In يفتح صفحة signin.html
document.addEventListener('DOMContentLoaded', () => {
    const authBtn = document.getElementById('authBtn');
    const authText = document.getElementById('authText');
    const welcomeMsg = document.querySelector('.welcome-message');
    const usernameSpan = document.getElementById('username');

    if (!authBtn) return;

    // ===== دالة تحديث واجهة المستخدم =====
    function updateUI() {
        const userData = localStorage.getItem('user');
        const isLoggedIn = !!userData;
        const user = isLoggedIn ? JSON.parse(userData) : null;

        if (isLoggedIn) {
            authText.textContent = 'signout';
            if (welcomeMsg && usernameSpan) {
                usernameSpan.textContent = user?.name?.split(' ')[0] || 'User';
                welcomeMsg.style.display = 'inline-block';
            }
        } else {
            authText.textContent = 'signin';
            if (welcomeMsg) welcomeMsg.style.display = 'none';
        }
    }

    // ===== تحديث أولي للواجهة =====
    updateUI();

    // ===== حدث الضغط على الزر =====
    authBtn.addEventListener('click', (event) => {
        event.preventDefault();

        const userData = localStorage.getItem('user');
        const isLoggedIn = !!userData;

        if (isLoggedIn) {
            // ==== تسجيل الخروج ====
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('admin_data');
            sessionStorage.removeItem('isAdminLoggedIn');

            updateUI();
             window.location.href = 'index.html';
        } else {
            // ==== لم يسجل الدخول بعد ====
            window.location.href = 'signin.html';
        }
    });
});

// ---------products----------
document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.querySelector('.product-grid');

    if (!productGrid) return console.error('product-grid element not found!');

    fetch('http://127.0.0.1:8000/api/products')
        .then(res => res.json())
        .then(products => {
            productGrid.innerHTML = '';

            products.forEach(product => {
                const div = document.createElement('div');
                div.classList.add('product-card');
                div.dataset.id=product.id;

                const badgeHtml = product.is_new ? `<span class="badge">NEW</span>` : '';

                div.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                        ${badgeHtml}
                    </div>
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price}</p>
                    <button class="add-to-cart">Add to Cart</button>
                `;

                productGrid.appendChild(div);
            });
        })
        .catch(err => {
            console.error('Error fetching products:', err);
            productGrid.innerHTML = '<p>Failed to load products</p>';
        });
});

// ------------profile----------
          
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = 'http://127.0.0.1:8000';

    const modal = document.getElementById('profileModal');
    const saveBtn = document.getElementById('saveProfileBtn');
    const avatarImg = document.getElementById('Avatar');
    const modalAvatar = document.getElementById('ModalAvatar');
    const closeBtn = document.querySelector('.closes-btn');
    const displayNameEl = document.getElementById('DisplayName');

    let fullName = "User Name";

    // ===== جلب بيانات البروفايل =====
    if (token && user) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                const profileData = data.profile || data;
                fullName = profileData.name || "User Name";
                displayNameEl.textContent = fullName.split(" ")[0];

                // لمنع الكاش
                const avatarUrl = profileData.avatar_url 
                    ? `${profileData.avatar_url}?t=${new Date().getTime()}` 
                    : `${API_BASE_URL}/storage/avatars/no-avatar.jpg`;
                
                avatarImg.src = avatarUrl;
                modalAvatar.src = avatarUrl;
//                 const newAvatar = result.profile?.avatar_url 
//     ? result.profile.avatar_url + '?t=' + new Date().getTime() 
//     : avatarImg.src; // لو مفيش صورة جديدة، خليه زي القديم

// avatarImg.src = newAvatar;
// modalAvatar.src = newAvatar;

                document.getElementById('Name').value = fullName;
                document.getElementById('Phone').value = profileData.phone || '';
                document.getElementById('Address').value = profileData.address || '';
                document.getElementById('birthdate').value = profileData.birthdate || '';
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
    } else {
        avatarImg.style.display = 'none';
        displayNameEl.style.display = 'none';
    }

    // ===== فتح المودال عند الضغط على الصورة =====
    avatarImg.addEventListener('click', () => {
        modal.style.display = 'flex';
        modalAvatar.src = avatarImg.src;
        document.getElementById('Name').value = fullName;
    });

    // ===== إغلاق المودال =====
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // ===== حفظ التعديلات =====
    saveBtn.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('name', document.getElementById('Name').value);
        formData.append('phone', document.getElementById('Phone').value);
        formData.append('address', document.getElementById('Address').value);
        formData.append('birthdate', document.getElementById('birthdate').value);

        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput.files[0]) formData.append('avatar', avatarInput.files[0]);

        try {
            const res = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });
            const result = await res.json();
            if (res.ok) {
                alert('Profile saved successfully!');

                // تحديث الصورة + منع الكاش
                const newAvatar = result.profile?.avatar_url 
                    ? `${result.profile.avatar_url}?t=${new Date().getTime()}` 
                    : avatarImg.src;
                
                avatarImg.src = newAvatar;
                modalAvatar.src = newAvatar;

                fullName = result.profile?.name || fullName;
                displayNameEl.textContent = fullName.split(" ")[0];
                modal.style.display = 'none';
            } else {
                alert(result.message || 'Failed to save profile');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Network error saving profile');
        }
    });

    // ===== معاينة الصورة في المودال =====
    document.getElementById('avatarInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { modalAvatar.src = e.target.result; };
            reader.readAsDataURL(file);
        }
    });
});