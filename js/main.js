
//INITIALIZE DATABASE (LocalStorage)

function initializeData() {
    if (!localStorage.getItem('medicines')) localStorage.setItem('medicines', JSON.stringify([]));
    if (!localStorage.getItem('requests')) localStorage.setItem('requests', JSON.stringify([]));
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([])); // Stores registered users
    if (!localStorage.getItem('currentUser')) localStorage.setItem('currentUser', JSON.stringify(null));
}
initializeData();


//UPDATE NAVBAR (Logout Button State)

function updateNavbar() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const navBtn = document.querySelector('.nav-btn');
    
    if (user && navBtn) {
        navBtn.innerText = user.role === 'admin' ? 'Logout (Admin)' : `Logout (${user.name || 'User'})`;
        navBtn.href = "#";
        navBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.setItem('currentUser', JSON.stringify(null));
            alert('Logged out successfully.');
            window.location.href = 'index.html';
        });
    }
}
updateNavbar();


 //USER REGISTRATION (Saves Account to LocalStorage)

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const phone = document.getElementById('regPhone').value.trim();
        const city = document.getElementById('regCity').value.trim();
        const pass = document.getElementById('regPassword').value;
        const confPass = document.getElementById('regConfirmPassword').value;
        
        const errorMsg = document.getElementById('passwordMismatchError');
        const errorAlert = document.getElementById('registerErrorAlert');
        const successMsg = document.getElementById('registerSuccessAlert');

        // Check if passwords match
        if (pass !== confPass) {
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerText = '⚠️ Passwords do not match! Please check again.';
            }
            return;
        } else {
            if (errorMsg) errorMsg.style.display = 'none';
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if email is already registered
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            if (errorAlert) {
                errorAlert.style.display = 'block';
                errorAlert.innerText = '❌ Email already registered! Please log in instead.';
            }
            return;
        }

        // Save new user object
        const newUser = {
            id: Date.now(),
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            city: city,
            password: pass
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        if (errorAlert) errorAlert.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';

        // Redirect to Login page after 1.5 seconds
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 1500);
    });
}

// ROLE-BASED & VERIFIED LOGIN SYSTEM

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const errorAlert = document.getElementById('loginErrorAlert');

        // A. Hardcoded Admin Login
        if (email === 'admin@medibridge.org' && password === 'admin123') {
            localStorage.setItem('currentUser', JSON.stringify({ email: email, name: 'Admin', role: 'admin' }));
            alert('Welcome Admin! Redirecting to Admin Dashboard...');
            window.location.href = 'admin.html';
            return;
        }

        // B. Check Registered Users Array
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const matchedUser = users.find(u => u.email === email && u.password === password);

        if (matchedUser) {
            // Successful User Login
            localStorage.setItem('currentUser', JSON.stringify({ email: matchedUser.email, name: matchedUser.name, role: 'user' }));
            alert(`Welcome back, ${matchedUser.name}! Redirecting to Browse...`);
            window.location.href = 'browse.html';
        } else {
            // Failed Login
            if (errorAlert) {
                errorAlert.style.display = 'block';
                errorAlert.innerText = '❌ Invalid email or password. Please register first.';
            }
        }
    });
}

//ADD MEDICINE FORM + PACKAGING PHOTO STORAGE
let uploadedPhotoDataUrl = ''; 

const medicinePhotoInput = document.getElementById('medicinePhoto');
const photoPreviewContainer = document.getElementById('photoPreviewContainer');

if (medicinePhotoInput && photoPreviewContainer) {
    medicinePhotoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedPhotoDataUrl = e.target.result; // Store base64 image data
                photoPreviewContainer.innerHTML = `
                    <div style="margin-top: 10px; text-align: center;">
                        <img src="${uploadedPhotoDataUrl}" alt="Packaging Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--border); object-fit: cover;" />
                        <p style="font-size: 12px; color: var(--primary-dark); margin-top: 5px;">✅ Photo attached successfully!</p>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    });
}

const addMedicineForm = document.getElementById('addMedicineForm');
if (addMedicineForm) {
    addMedicineForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const newMedicine = {
            id: Date.now(),
            name: document.getElementById('medicineName').value.trim(),
            category: document.getElementById('category').value,
            quantity: document.getElementById('quantity').value.trim(),
            expiryDate: document.getElementById('expiryDate').value,
            condition: document.getElementById('condition') ? document.getElementById('condition').value : '',
            city: document.getElementById('city').value.trim(),
            contact: document.getElementById('contact').value.trim(),
            description: document.getElementById('description') ? document.getElementById('description').value.trim() : '',
            photo: uploadedPhotoDataUrl || '', // Save uploaded image
            status: 'pending' // Requires Admin approval
        };

        const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
        medicines.push(newMedicine);
        localStorage.setItem('medicines', JSON.stringify(medicines));

        alert('Donation submitted successfully! Waiting for Admin approval.');
        window.location.href = 'browse.html'; // Direct redirect to view in admin queue
    });
}

//RENDER BROWSE PAGE
function renderBrowsePage() {
    const container = document.getElementById('medicinesContainer');
    const noMessage = document.getElementById('noMedicinesMessage');
    if (!container) return;

    const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    const approvedMedicines = medicines.filter(med => med.status === 'approved');

    if (approvedMedicines.length === 0) {
        container.innerHTML = '';
        if (noMessage) noMessage.style.display = 'block';
        return;
    }

    if (noMessage) noMessage.style.display = 'none';

    container.innerHTML = approvedMedicines.map(med => `
        <div class="card medicine-card">
            ${med.photo ? `<div style="width: 100%; height: 160px; overflow: hidden; border-radius: 8px 8px 0 0;"><img src="${med.photo}" alt="${med.name}" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
            <div class="card-header">
                <h3>${med.name}</h3>
                <span class="badge" style="background: var(--primary); color: white;">${med.category}</span>
            </div>
            <div class="card-body">
                <p><strong>Quantity:</strong> ${med.quantity}</p>
                <p><strong>Expiry:</strong> ${med.expiryDate}</p>
                <p><strong>Condition:</strong> ${med.condition || 'N/A'}</p>
                <p><strong>City:</strong> 📍 ${med.city}</p>
                ${med.description ? `<p style="margin-top: 8px; font-size: 13px; color: var(--text-light);">${med.description}</p>` : ''}
            </div>
            <div class="card-footer" style="padding: 15px; text-align: center; border-top: 1px solid var(--border);">
                <a href="tel:${med.contact}" class="btn btn-primary" style="width: 100%; text-decoration: none;">📞 Contact Donor (${med.contact})</a>
            </div>
        </div>
    `).join('');
}
renderBrowsePage();

//RENDER ADMIN DASHBOARD (Pending Queue)
function renderAdminDashboard() {
    const pendingContainer = document.getElementById('adminPendingContainer');
    const activeContainer = document.getElementById('adminActiveContainer');
    if (!pendingContainer) return; // Exit if not on admin.html

    const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    const pendingList = medicines.filter(m => m.status === 'pending');
    const activeList = medicines.filter(m => m.status === 'approved');

    // Update Dashboard Counter Badges
    const pendingCountEl = document.getElementById('adminPendingCount');
    const activeCountEl = document.getElementById('adminActiveCount');
    const reportedCountEl = document.getElementById('adminReportedCount');

    if (pendingCountEl) pendingCountEl.innerText = pendingList.length;
    if (activeCountEl) activeCountEl.innerText = activeList.length;
    if (reportedCountEl) reportedCountEl.innerText = 0;

    // 1. Render Pending Approvals Queue
    if (pendingList.length === 0) {
        pendingContainer.innerHTML = `
            <div style="text-align: center; padding: 25px; background: var(--white); border-radius: 10px; border: 1px solid var(--border);">
                <p style="color: var(--text-light); margin: 0;">✅ No pending donations to review right now!</p>
            </div>
        `;
    } else {
        pendingContainer.innerHTML = pendingList.map(med => `
            <div style="background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 15px;">
                <div style="display: flex; gap: 15px; align-items: center;">
                    ${med.photo ? `<img src="${med.photo}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">` : ''}
                    <div>
                        <h3 style="font-size: 18px; color: var(--primary-dark); margin: 0;">${med.name} 
                            <span style="font-size: 11px; background: #E8F0EC; color: var(--primary-dark); padding: 2px 8px; border-radius: 4px; margin-left: 6px;">${med.category}</span>
                        </h3>
                        <p style="font-size: 13px; color: var(--text-light); margin: 6px 0 0;">
                            City: ${med.city} | Qty: ${med.quantity} | Exp: ${med.expiryDate} | Contact: ${med.contact}
                        </p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="approveMedicine(${med.id})" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;">Approve Listing</button>
                    <button onclick="rejectMedicine(${med.id})" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; background: #FDF3F4; color: #D9534F; border: 1px solid #F5C6CB;">Reject</button>
                </div>
            </div>
        `).join('');
    }

    // 2. Render Active / Live Listings with Delete Controls
    if (activeContainer) {
        if (activeList.length === 0) {
            activeContainer.innerHTML = `
                <div style="text-align: center; padding: 25px; background: var(--white); border-radius: 10px; border: 1px solid var(--border);">
                    <p style="color: var(--text-light); margin: 0;">No active listings currently live on the Browse page.</p>
                </div>
            `;
        } else {
            activeContainer.innerHTML = activeList.map(med => `
                <div style="background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 18px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 15px;">
                    <div style="display: flex; gap: 15px; align-items: center;">
                        ${med.photo ? `<img src="${med.photo}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">` : ''}
                        <div>
                            <h3 style="font-size: 16px; color: var(--text-dark); margin: 0;">${med.name} 
                                <span style="font-size: 11px; background: #E8F0EC; color: var(--primary-dark); padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${med.category}</span>
                            </h3>
                            <p style="font-size: 12px; color: var(--text-light); margin: 4px 0 0;">
                                City: ${med.city} | Qty: ${med.quantity} | Exp: ${med.expiryDate} | Status: <span style="color: green; font-weight: 600;">Live</span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <button onclick="deleteMedicine(${med.id})" class="btn btn-secondary" style="padding: 7px 14px; font-size: 12px; background: #FDF3F4; color: #D9534F; border: 1px solid #F5C6CB;">🗑️ Delete Listing</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Global function: Admin Approves Listing
window.approveMedicine = function(id) {
    let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    medicines = medicines.map(m => m.id === id ? { ...m, status: 'approved' } : m);
    localStorage.setItem('medicines', JSON.stringify(medicines));
    alert('Medicine Approved! It is now live on the Browse page.');
    renderAdminDashboard();
};

// Global function: Admin Rejects Pending Listing
window.rejectMedicine = function(id) {
    let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    medicines = medicines.filter(m => m.id !== id);
    localStorage.setItem('medicines', JSON.stringify(medicines));
    alert('Listing Rejected and removed.');
    renderAdminDashboard();
};

// Global function: Admin Deletes Live Active Listing
window.deleteMedicine = function(id) {
    if (confirm('Are you sure you want to permanently delete this active listing?')) {
        let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
        medicines = medicines.filter(m => m.id !== id);
        localStorage.setItem('medicines', JSON.stringify(medicines));
        alert('Active listing deleted successfully!');
        renderAdminDashboard(); // Refresh admin view
    }
};

renderAdminDashboard();

//SEARCH & FILTER ON BROWSE PAGE
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

if (searchInput || categoryFilter) {
    function applyFilters() {
        const term = (searchInput ? searchInput.value.toLowerCase().trim() : '');
        const cat = (categoryFilter ? categoryFilter.value : 'all');
        const allApproved = (JSON.parse(localStorage.getItem('medicines')) || []).filter(m => m.status === 'approved');

        const filtered = allApproved.filter(med => {
            const matchesSearch = med.name.toLowerCase().includes(term) || (med.city && med.city.toLowerCase().includes(term));
            const matchesCat = (cat === 'all' || cat === '' || med.category === cat);
            return matchesSearch && matchesCat;
        });

        const container = document.getElementById('medicinesContainer');
        const noMessage = document.getElementById('noMedicinesMessage');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '';
            if (noMessage) noMessage.style.display = 'block';
            return;
        }

        if (noMessage) noMessage.style.display = 'none';

        container.innerHTML = filtered.map(med => `
            <div class="card medicine-card">
                ${med.photo ? `<div style="width: 100%; height: 160px; overflow: hidden; border-radius: 8px 8px 0 0;"><img src="${med.photo}" alt="${med.name}" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
                <div class="card-header">
                    <h3>${med.name}</h3>
                    <span class="badge" style="background: var(--primary); color: white;">${med.category}</span>
                </div>
                <div class="card-body">
                    <p><strong>Quantity:</strong> ${med.quantity}</p>
                    <p><strong>Expiry:</strong> ${med.expiryDate}</p>
                    <p><strong>City:</strong> 📍 ${med.city}</p>
                </div>
                <div class="card-footer" style="padding: 15px; text-align: center; border-top: 1px solid var(--border);">
                    <a href="tel:${med.contact}" class="btn btn-primary" style="width: 100%; text-decoration: none;">📞 Contact Donor (${med.contact})</a>
                </div>
            </div>
        `).join('');
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
}

//REQUEST FORM & REQUEST BOARD
// ------------------------------------------
// REQUEST FORM & REQUEST BOARD (With Prescription Photo)
// ------------------------------------------
let uploadedReqPhotoDataUrl = '';

const reqPhotoInput = document.getElementById('reqPrescriptionPhoto');
const reqPhotoPreviewContainer = document.getElementById('reqPhotoPreviewContainer');

// 1. Live photo preview when chosen
if (reqPhotoInput) {
    reqPhotoInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedReqPhotoDataUrl = e.target.result; // Base64 string
                if (reqPhotoPreviewContainer) {
                    reqPhotoPreviewContainer.style.display = 'block';
                    reqPhotoPreviewContainer.innerHTML = `
                        <div style="margin-top: 10px; padding: 10px; background: #ffffff; border: 1px solid var(--border); border-radius: 8px; text-align: center;">
                            <img src="${uploadedReqPhotoDataUrl}" alt="Prescription Preview" style="max-width: 100%; max-height: 180px; border-radius: 6px; object-fit: contain; display: block; margin: 0 auto 8px;" />
                            <span style="font-size: 13px; color: var(--primary-dark); font-weight: 600;">✅ Prescription attached successfully!</span>
                        </div>
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// 2. Submit request (saves photo)
const requestForm = document.getElementById('requestForm');
if (requestForm) {
    requestForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const reqs = JSON.parse(localStorage.getItem('requests')) || [];
        reqs.push({
            id: Date.now(),
            name: document.getElementById('reqMedicineName').value.trim(),
            urgency: document.getElementById('reqUrgency').value,
            city: document.getElementById('reqCity').value.trim(),
            contact: document.getElementById('reqContact').value.trim(),
            description: document.getElementById('reqDescription') ? document.getElementById('reqDescription').value.trim() : '',
            photo: uploadedReqPhotoDataUrl || '' // <-- Saves the photo!
        });
        localStorage.setItem('requests', JSON.stringify(reqs));
        alert('Medicine request posted successfully!');
        window.location.reload();
    });
}

// 3. Render request cards (displays photo)
const requestsContainer = document.getElementById('requestsContainer');
const noRequestsMessage = document.getElementById('noRequestsMessage');
if (requestsContainer) {
    const reqs = JSON.parse(localStorage.getItem('requests')) || [];
    if (reqs.length === 0) {
        if (noRequestsMessage) noRequestsMessage.style.display = 'block';
    } else {
        if (noRequestsMessage) noRequestsMessage.style.display = 'none';
        requestsContainer.innerHTML = reqs.map(r => `
            <div class="card" style="padding: 18px; border-radius: 12px; background: var(--white); border: 1px solid var(--border);">
                ${r.photo ? `<div style="width: 100%; height: 160px; overflow: hidden; border-radius: 8px; margin-bottom: 12px; border: 1px solid var(--border);"><img src="${r.photo}" alt="Prescription" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h3 style="color: var(--primary-dark); margin: 0;">${r.name}</h3>
                    <span style="font-size: 11px; background: ${r.urgency === 'High' ? '#FDF3F4' : '#E8F0EC'}; color: ${r.urgency === 'High' ? '#D9534F' : 'var(--primary-dark)'}; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${r.urgency} Urgency</span>
                </div>
                <p style="margin: 4px 0; font-size: 13px;"><strong>City:</strong> 📍 ${r.city}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Contact:</strong> 📞 ${r.contact}</p>
                ${r.description ? `<p style="margin-top: 8px; font-size: 13px; color: var(--text-light);">${r.description}</p>` : ''}
            </div>
        `).join('');
    }
}

//DYNAMIC LIVE STATS COUNT-UP ANIMATION
function animateStats() {
    const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    const requests = JSON.parse(localStorage.getItem('requests')) || [];
    
    // Compute dynamic numbers from database
    const totalMedicines = medicines.length;
    const totalRequests = requests.length;
    
    // Find unique cities
    const citiesSet = new Set();
    medicines.forEach(m => { if (m.city) citiesSet.add(m.city.toLowerCase()); });
    requests.forEach(r => { if (r.city) citiesSet.add(r.city.toLowerCase()); });
    const totalCities = citiesSet.size;

    const stats = [
        { id: 'stat-medicines', target: totalMedicines },
        { id: 'stat-helped', target: totalRequests },
        { id: 'stat-cities', target: totalCities }
    ];

    stats.forEach(function(stat) {
        const el = document.getElementById(stat.id);
        if (!el) return;

        let current = 0;
        const targetNum = stat.target;
        
        if (targetNum === 0) {
            el.innerText = '0';
            return;
        }

        const increment = Math.max(1, Math.ceil(targetNum / 20));
        const timer = setInterval(function() {
            current += increment;
            if (current >= targetNum) {
                el.innerText = targetNum;
                clearInterval(timer);
            } else {
                el.innerText = current;
            }
        }, 50);
    });
}
animateStats();