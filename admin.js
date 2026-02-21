// ================= Page Navigation =================
function showPage(id){
  let pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ================= Charts =================
const ctx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue ($)',
      data: [1200, 1900, 3000, 2500, 3200, 4000],
      backgroundColor: 'rgba(115, 5, 5, 0.2)',
      borderColor: '#aa2b08',
      borderWidth: 2,
      fill:true,
      tension:0.3
    }]
  },
  options: {
    responsive:true,
    plugins: { legend: { display: true, position: 'top' } },
    scales: { y: { beginAtZero:true } }
  }
});

const ctt = document.getElementById('saleChart').getContext('2d');
const saleChart = new Chart(ctt, {
  type: 'bar',
  data: {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [{
      label: 'Revenue ($)',
      data: [1000, 1400, 2200, 2400, 3200, 4000],
      backgroundColor: 'rgba(170, 108, 7, 0.2)',
      borderColor: '#8f2602',
      borderWidth: 2,
      fill:true,
      tension:0.3
    }]
  },
  options: {
    responsive:true,
    plugins: { legend: { display: true, position: 'top' } },
    scales: { y: { beginAtZero:true } }
  }
});

// ================= Admin Login Check =================
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    // التحقق من أن المستخدم admin
    if (!user || user.role !== 'admin') {
        alert('You must be an admin to access this page');
        window.location.href = '/'; // اذهب للصفحة الرئيسية
        return;
    }

    // عرض اسم الأدمن
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = user.name;
    }

    // زر تسجيل الخروج في صفحة admin
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('user');
                localStorage.removeItem('access_token');
                localStorage.removeItem('admin_data');
                sessionStorage.removeItem('isAdminLoggedIn');

                window.location.href = '/index.html'; // العودة للصفحة الرئيسية
            }
        });
    }
});

// ================= Products Modal & CRUD =================

document.addEventListener('DOMContentLoaded', function() {

  const tbody = document.querySelector('#products tbody');
  const addBtn = document.querySelector('.add-btn');
  const modal = document.getElementById('productModal');

  const productId = document.getElementById('productId');
  const pName = document.getElementById('pName');
  const pPrice = document.getElementById('pPrice');
  const pStock = document.getElementById('pStock');
  const pSize = document.getElementById('pSize');
  const pImage = document.getElementById('pImage');

  // ---------- Modal ----------
  function openModal(edit = false){
    modal.style.display = 'flex';
    document.getElementById('modalTitle').innerText = edit ? 'Edit Product' : 'Add Product';

    if(!edit){
      productId.value = '';
      pName.value = '';
      pPrice.value = '';
      pStock.value = '';
      pSize.value = '';
      pImage.value = '';
    }
  }

  function closeModal(){
    modal.style.display = 'none';
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  // ---------- Load Products ----------
  function loadProducts(){
    fetch('http://127.0.0.1:8000/api/products', {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = '';
      data.forEach((p, index) => {
        tbody.innerHTML += `
          <tr data-id="${p.p_id}">
            <td>${index + 1}</td>
            <td>
              <img src="${p.image ?? 'default.jpg'}" width="50">
            </td>
            <td>${p.name}</td>
            <td>$${p.price}</td>
            <td>${p.stock ?? '0'}</td>
            <td>${p.size ?? '-'}</td>
            <td>
              <button class="btn edit" onclick="editProduct(${p.p_id})">Edit</button>
              <button class="btn delete" onclick="deleteProduct(${p.p_id})">Delete</button>
            </td>
          </tr>
        `;
      });
    })
    .catch(err => console.error('Load error:', err));
  }

  loadProducts();

  // ---------- Add Button ----------
  if (addBtn) {
    addBtn.addEventListener('click', () => openModal(false));
  }

  // ---------- Save Product (Add / Edit) ----------
  window.saveProduct = function() {

    const id = productId.value;
    const formData = new FormData();

    formData.append('name', pName.value);
    formData.append('price', pPrice.value);
    formData.append('stock', pStock.value);
    formData.append('size', pSize.value);

    if (pImage.files[0]) {
      formData.append('image', pImage.files[0]);
    }

    let url = id
      ? `http://127.0.0.1:8000/api/products/${id}`
      : 'http://127.0.0.1:8000/api/products';

    // 🔥 Laravel FormData Fix
    if (id) {
      formData.append('_method', 'PUT');
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        'Accept': 'application/json'
      },
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Product saved successfully ✅');
      closeModal();
      loadProducts();
    })
    .catch(err => {
      console.error('Save error:', err);
      alert('Error saving product ❌');
    });
  }

  // ---------- Edit Product ----------
  window.editProduct = function(id){
    fetch(`http://127.0.0.1:8000/api/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .then(p => {
      productId.value = p.p_id;
      pName.value = p.name;
      pPrice.value = p.price;
      pStock.value = p.stock ?? '';
      pSize.value = p.size ?? '';
      pImage.value = ''; // مهم جدًا
      openModal(true);
    })
    .catch(err => console.error('Edit error:', err));
  }

  // ---------- Delete Product ----------
  window.deleteProduct = function(id){
    if (!confirm('Are you sure you want to delete this product?')) return;

    fetch(`http://127.0.0.1:8000/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        'Accept': 'application/json'
      }
    })
    .then(res => res.json())
    .then(() => loadProducts())
    .catch(err => console.error('Delete error:', err));
  }

});
// order ================

document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('orders-tbody');

    function getStatusClass(status) {
        switch(status) {
            case 'pending': return 'pending';
            case 'processing': return 'processing';
            case 'completed': return 'completed';
            case 'cancelled': return 'cancelled';
            default: return '';
        }
    }

    fetch('http://127.0.0.1:8000/api/orders')
        .then(response => response.json())
        .then(data => {
            tbody.innerHTML = '';

            data.forEach(order => {
                const tr = document.createElement('tr');

                // ✅ استخدام العلاقة المُحملة من Backend
                const customer = order.user ? order.user.name : 'Unknown';

                tr.innerHTML = `
                    <td>#${order.o_id}</td>
                    <td>${customer}</td>
                    <td>$${order.total_price}</td>
                    <td></td>
                `;

                const statusTd = tr.querySelector('td:last-child');

                const statusSelect = document.createElement('select');
                ['pending', 'processing', 'completed', 'cancelled'].forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
                    if (status === order.status) option.selected = true;
                    statusSelect.appendChild(option);
                });

                const statusSpan = document.createElement('span');
                statusSpan.className = `status ${getStatusClass(order.status)}`;
                statusSpan.textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
                statusSpan.style.marginLeft = '10px';

                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = 'Update';
                confirmBtn.style.cssText = 'padding:5px;margin-left:5px;border:none;border-radius:5px;cursor:pointer;background-color:#059240;';
                
                confirmBtn.addEventListener('click', () => {
                    const newStatus = statusSelect.value;

                    fetch(`http://127.0.0.1:8000/api/orders/${order.o_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({ status: newStatus })
                    })
                    .then(res => res.json())
                    .then(updated => {
                        statusSpan.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                        statusSpan.className = `status ${getStatusClass(newStatus)}`;
                        alert('Order status updated successfully!');
                    })
                    .catch(err => {
                        console.error('Error updating status:', err);
                        alert('Failed to update status.');
                    });
                });

                statusTd.appendChild(statusSelect);
                statusTd.appendChild(confirmBtn);
                statusTd.appendChild(statusSpan);

                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Error fetching orders:', err));
});

// customer orders ================

  document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#users tbody');

    // استدعاء الـ API
    fetch('http://127.0.0.1:8000/api/admin/users-orders')
    .then(res => res.json())
    .then(users => {
        tbody.innerHTML = ''; // نفضي الـ tbody قبل ملئه

        users.forEach(user => {
            // لو عايز تظهر الأوردرات مفصلة
            let ordersHtml = '';
            if (user.orders.length > 0) {
                ordersHtml = '<ul>';
                user.orders.forEach(order => {
                    ordersHtml += `<li>${order.product_name} - Qty: ${order.quantity} - Price: ${order.price}</li>`;
                });
                ordersHtml += '</ul>';
            } else {
                ordersHtml = 'No Orders';
            }

            // نضيف صف لكل User
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.orders_count}</td>
                <td>${user.phone}</td>
                <!-- لو عايز تظهر التفاصيل تحتها ممكن تستخدم ordersHtml -->
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(err => {
        console.error('Error fetching users orders:', err);
        tbody.innerHTML = '<tr><td colspan="3">Failed to load data</td></tr>';
    });
});

// =================== Admin Profile =================


document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = 'http://127.0.0.1:8000';

    if (!token || !user) {
        alert('You must login first!');
        window.location.href = '/signin.html';
        return;
    }

    // عناصر المودال
    const modal = document.getElementById('profileModal');
    const editBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.querySelector('.close-btn');
    const saveBtn = document.getElementById('saveProfileBtn');

    // فتح المودال
    editBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        // نسخ البيانات الحالية للمودال
        document.getElementById('ModalAvatar').src = document.getElementById('Avatar').src;
    });

    // إغلاق المودال
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // إغلاق عند الضغط خارج المودال
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // ===== جلب بيانات البروفايل =====
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.message || 'Failed to fetch profile');
            return;
        }

        const profileData = data.profile || data;

        // ✅ عرض في القائمة
        document.getElementById('Avatar').src = profileData.avatar_url || `${API_BASE_URL}/storage/avatars/no-avatar.jpg`;
        document.getElementById('DisplayName').textContent = profileData.name || 'User Name';

        // ✅ تعبئة المودال
        document.getElementById('ModalAvatar').src = profileData.avatar_url || `${API_BASE_URL}/storage/avatars/no-avatar.jpg`;
        document.getElementById('Name').value = profileData.name || '';
        document.getElementById('Phone').value = profileData.phone || '';
        document.getElementById('Address').value = profileData.address || '';
        document.getElementById('birthdate').value = profileData.birthdate || '';

    } catch (err) {
        console.error('Fetch error:', err);
    }

    // ===== حفظ التعديلات =====
    saveBtn.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('name', document.getElementById('Name').value);
        formData.append('phone', document.getElementById('Phone').value);
        formData.append('address', document.getElementById('Address').value);
        formData.append('birthdate', document.getElementById('birthdate').value);

        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput.files[0]) {
            formData.append('avatar', avatarInput.files[0]);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await res.json();
            if (!res.ok) {
                alert(result.message || 'Failed to save profile');
                return;
            }

            alert('Profile saved successfully!');

            // ✅ تحديث القائمة
            document.getElementById('Avatar').src = result.profile?.avatar_url || `${API_BASE_URL}/storage/avatars/no-avatar.jpg`;
            document.getElementById('DisplayName').textContent = result.profile?.name || 'User Name';

            // إغلاق المودال
            modal.style.display = 'none';

        } catch (err) {
            console.error('Save error:', err);
            alert('Network error saving profile');
        }
    });

    // ===== معاينة الصورة =====
    document.getElementById('avatarInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('ModalAvatar').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});