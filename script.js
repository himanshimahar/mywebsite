const screens = {
    splash: document.getElementById('screen-splash'),
    login: document.getElementById('screen-login'),
    register: document.getElementById('screen-register'),
    dashboard: document.getElementById('screen-dashboard'),
    complaint: document.getElementById('screen-complaint'),
    status: document.getElementById('screen-status'),
    profile: document.getElementById('screen-profile'),
    about: document.getElementById('screen-about'),
    admin: document.getElementById('screen-admin'),
};

const state = {
    currentUser: null,
};

const usersKey = 'swachhNagarUsers';
const complaintsKey = 'swachhNagarComplaints';

const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const complaintMessage = document.getElementById('complaint-message');
const dashboardWelcome = document.getElementById('dashboard-welcome');
const feedMessage = document.getElementById('feed-message');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileMobile = document.getElementById('profile-mobile');
const profileStatus = document.getElementById('profile-status');
const adminHintElement = document.getElementById('admin-hint');
const loginIcon = document.getElementById('login-icon');
const loginTitle = document.getElementById('login-title');
let adminHintTimer = null;

const buildUsers = () => {
    const stored = localStorage.getItem(usersKey);
    if (!stored) {
        const adminUser = {
            id: 'admin',
            name: 'himanshi mahar',
            email: 'admin@swachhnagar.com',
            mobile: '0000000000',
            username: 'admin',
            password: 'himanshi@2005',
            isAdmin: true,
        };
        localStorage.setItem(usersKey, JSON.stringify([adminUser]));
        return [adminUser];
    }
    return JSON.parse(stored);
};

const getUsers = () => buildUsers();

const saveUsers = (users) => localStorage.setItem(usersKey, JSON.stringify(users));
const getComplaints = () => JSON.parse(localStorage.getItem(complaintsKey) || '[]');
const saveComplaints = (complaints) => localStorage.setItem(complaintsKey, JSON.stringify(complaints));

const switchScreen = (screenName) => {
    Object.values(screens).forEach((screen) => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
};

const showToast = (element, text, success = true) => {
    element.textContent = text;
    element.style.color = success ? 'var(--text)' : 'var(--danger)';
};

const clearMessages = () => {
    loginMessage.textContent = '';
    registerMessage.textContent = '';
    complaintMessage.textContent = '';
};

const loadDashboard = () => {
    const user = state.currentUser;
    dashboardWelcome.textContent = user ? `Hello, ${user.name}` : 'Hello, Citizen!';
    document.getElementById('dashboard-date').textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    renderHomeFeed();
    updateDashboardStats();
    renderProfile();
    activateNavButton('nav-home');
    switchScreen('dashboard');
    screens.admin.classList.remove('active');
};

const loadAdminPanel = () => {
    populateAdminPanel();
    activateNavButton(null);
    switchScreen('admin');
};

const activateNavButton = (id) => {
    document.querySelectorAll('.nav-button').forEach((button) => {
        button.classList.toggle('active', button.id === id);
    });
};

const renderProfile = () => {
    if (!state.currentUser) return;
    profileName.textContent = state.currentUser.name || 'Citizen';
    profileEmail.textContent = state.currentUser.email || 'Not available';
    profileMobile.textContent = state.currentUser.mobile || 'Not provided';
    profileStatus.textContent = state.currentUser.isAdmin ? 'Administrator' : 'Active User';
};

const updateDashboardStats = () => {
    const complaints = getComplaints();
    const resolvedCount = complaints.filter((complaint) => complaint.status === 'Completed').length;
    const totalCount = complaints.length;
    const resolvedElement = document.getElementById('stat-resolved-count');
    const communityElement = document.getElementById('stat-community-count');
    if (resolvedElement) resolvedElement.textContent = `${resolvedCount}`;
    if (communityElement) communityElement.textContent = `${totalCount}`;
};

const renderHomeFeed = () => {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;
    const complaints = getComplaints().slice().reverse();
    if (complaints.length === 0) {
        feedList.innerHTML = '<p class="empty-feed">No city updates yet. Post a complaint to start a discussion.</p>';
        return;
    }
    feedList.innerHTML = complaints.map((complaint) => {
        const beforeImage = complaint.image ? complaint.image : '';
        const afterImage = complaint.image ? complaint.image : '';
        const statusLabel = complaint.status || 'Pending';
        return `
            <div class="post-card">
                <div class="post-meta">
                    <strong>${complaint.name}</strong>
                    <span>${complaint.location || 'Tanakpur'}</span>
                </div>
                <h4 class="post-title">${complaint.type || 'Complaint Update'} • ${complaint.id}</h4>
                <p class="post-description">${complaint.description || 'No description provided.'}</p>
                <div class="post-images">
                    <div class="post-image">${beforeImage ? `<img src="${beforeImage}" alt="Before"/>` : '<div class="empty-image">Before image</div>'}</div>
                    <div class="post-image">${afterImage ? `<img src="${afterImage}" alt="After"/>` : '<div class="empty-image">After image</div>'}</div>
                </div>
                <div class="post-footer">
                    <span class="badge-status">${statusLabel}</span>
                    <button class="like-button">👍 Support</button>
                </div>
            </div>
        `;
    }).join('');
};

const handleFeedPost = async () => {
    const title = document.getElementById('feed-title').value.trim();
    const location = document.getElementById('feed-location').value.trim();
    const description = document.getElementById('feed-complaint-text').value.trim();
    const beforeFile = document.getElementById('feed-before-image').files[0];
    const afterFile = document.getElementById('feed-after-image').files[0];

    if (!description || !title || !location) {
        if (feedMessage) showToast(feedMessage, 'Please add title, location and complaint text.', false);
        return;
    }

    let imageData = null;
    if (beforeFile) {
        imageData = await readFileAsDataURL(beforeFile);
    } else if (afterFile) {
        imageData = await readFileAsDataURL(afterFile);
    }

    const complaints = getComplaints();
    complaints.push({
        id: generateComplaintId(),
        userId: state.currentUser?.id || 'guest',
        name: state.currentUser?.name || 'Tanakpur Resident',
        location,
        type: title,
        description,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        image: imageData,
    });
    saveComplaints(complaints);
    renderHomeFeed();
    if (feedMessage) showToast(feedMessage, 'Complaint posted to the city feed.', true);
    document.getElementById('feed-title').value = '';
    document.getElementById('feed-location').value = '';
    document.getElementById('feed-complaint-text').value = '';
    document.getElementById('feed-before-image').value = '';
    document.getElementById('feed-after-image').value = '';
};

const activateAdminHint = (text) => {
    if (!adminHintElement) return;
    adminHintElement.textContent = text;
    adminHintElement.classList.add('visible');
    setTimeout(() => adminHintElement.classList.remove('visible'), 2800);
};

const handleLogin = () => {
    const loginValue = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const normalizedLogin = loginValue.toLowerCase();
    const normalizedPhone = loginValue.replace(/\D/g, '');

    if (loginValue === 'himanshi mahar' && password === 'himanshi@2005') {
        state.currentUser = {
            id: 'secret-admin',
            name: 'himanshi mahar',
            isAdmin: true,
        };
        clearMessages();
        loadAdminPanel();
        return;
    }

    const users = getUsers();
    const matched = users.find((user) => {
        const emailMatch = user.email?.toLowerCase() === normalizedLogin;
        const usernameMatch = user.username?.toLowerCase() === normalizedLogin;
        const phoneMatch = user.mobile?.replace(/\D/g, '') === normalizedPhone && normalizedPhone !== '';
        return (emailMatch || usernameMatch || phoneMatch) && user.password === password;
    });

    if (!matched) {
        showToast(loginMessage, 'Invalid username or password', false);
        return;
    }

    state.currentUser = matched;
    clearMessages();
    if (matched.isAdmin) {
        loadAdminPanel();
    } else {
        loadDashboard();
    }
};

const handleRegister = () => {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const mobile = document.getElementById('register-mobile').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (!name || !email || !mobile || !password) {
        showToast(registerMessage, 'Please fill in all fields', false);
        return;
    }

    const users = getUsers();
    const duplicateEmail = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (duplicateEmail) {
        showToast(registerMessage, 'Email already registered', false);
        return;
    }
    const duplicateMobile = users.find((user) => user.mobile?.replace(/\D/g, '') === mobile.replace(/\D/g, ''));
    if (duplicateMobile) {
        showToast(registerMessage, 'Mobile number already registered', false);
        return;
    }

    const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        mobile,
        username: email,
        password,
        isAdmin: false,
    };
    users.push(newUser);
    saveUsers(users);
    state.currentUser = newUser;
    showToast(registerMessage, 'Registration successful! Logging you in...', true);
    setTimeout(() => {
        clearMessages();
        loadDashboard();
    }, 900);
};

const generateComplaintId = () => `SN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

const renderStatusList = () => {
    const container = document.getElementById('status-list');
    container.innerHTML = '';
    const complaints = getComplaints().filter((item) => item.userId === state.currentUser?.id);
    if (complaints.length === 0) {
        container.innerHTML = '<p>No complaints submitted yet.</p>';
        return;
    }

    complaints.reverse().forEach((complaint) => {
        const card = document.createElement('div');
        card.className = 'status-item';
        card.innerHTML = `
      <h3>${complaint.type} - ${complaint.id}</h3>
      <div class="status-meta">
        <span>${complaint.location || 'Location not specified'}</span>
        <span class="status-badge">${complaint.status}</span>
      </div>
      <p>${complaint.description}</p>
    `;
        container.appendChild(card);
    });
};

const populateAdminPanel = () => {
    const container = document.getElementById('admin-complaints');
    container.innerHTML = '';
    const complaints = getComplaints();
    const users = getUsers();
    if (complaints.length === 0) {
        container.innerHTML = '<p>No complaints available.</p>';
        return;
    }

    complaints.reverse().forEach((complaint) => {
        const user = users.find(u => u.id === complaint.userId) || {};
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
      <h3>${complaint.type} - ${complaint.id}</h3>
      <div class="status-meta">
        <span>${complaint.name} | ${complaint.location || 'Location not set'}</span>
        <span class="status-badge">${complaint.status}</span>
      </div>
      <div class="user-details">
        <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${user.mobile || 'N/A'}</p>
      </div>
      <p>${complaint.description}</p>
      <div class="actions-row">
        <select data-id="${complaint.id}">
          <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Accepted" ${complaint.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
          <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${complaint.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Rejected" ${complaint.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
        <button class="secondary" data-update="${complaint.id}">Update Status</button>
        <button class="secondary" data-delete="${complaint.id}">Delete</button>
        ${user.email ? `<button class="link" data-email="${user.email}">📧 Email</button>` : ''}
        ${user.mobile ? `<button class="link" data-mobile="${user.mobile}">📞 Call</button>` : ''}
      </div>
    `;
        container.appendChild(item);
    });

    container.querySelectorAll('button[data-update]').forEach((button) => {
        button.addEventListener('click', () => {
            const complaintId = button.dataset.update;
            const select = container.querySelector(`select[data-id="${complaintId}"]`);
            const complaints = getComplaints();
            const complaint = complaints.find((item) => item.id === complaintId);
            if (complaint && select) {
                complaint.status = select.value;
                saveComplaints(complaints);
                populateAdminPanel();
            }
        });
    });

    container.querySelectorAll('button[data-email]').forEach((button) => {
        button.addEventListener('click', () => {
            const email = button.dataset.email;
            window.location.href = `mailto:${email}?subject=Regarding your complaint`;
        });
    });

    container.querySelectorAll('button[data-mobile]').forEach((button) => {
        button.addEventListener('click', () => {
            const mobile = button.dataset.mobile;
            window.location.href = `tel:${mobile}`;
        });
    });

    container.querySelectorAll('button[data-delete]').forEach((button) => {
        button.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this complaint?')) {
                const complaintId = button.dataset.delete;
                const complaints = getComplaints();
                const updatedComplaints = complaints.filter((item) => item.id !== complaintId);
                saveComplaints(updatedComplaints);
                populateAdminPanel();
            }
        });
    });
};

const clearComplaintForm = () => {
    document.getElementById('complaint-name').value = '';
    document.getElementById('complaint-location').value = '';
    document.getElementById('complaint-description').value = '';
    document.getElementById('complaint-image').value = '';
};

const submitComplaint = async () => {
    const name = document.getElementById('complaint-name').value.trim();
    const location = document.getElementById('complaint-location').value.trim();
    const type = document.getElementById('complaint-type').value;
    const description = document.getElementById('complaint-description').value.trim();
    const imageInput = document.getElementById('complaint-image');
    const imageFile = imageInput.files[0];

    if (!name || !location || !description) {
        showToast(complaintMessage, 'Please complete all required fields', false);
        return;
    }

    let imageData = null;
    if (imageFile) {
        imageData = await readFileAsDataURL(imageFile);
    }

    const complaints = getComplaints();
    complaints.push({
        id: generateComplaintId(),
        userId: state.currentUser?.id || 'guest',
        name,
        location,
        type,
        description,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        image: imageData,
    });
    saveComplaints(complaints);
    showToast(complaintMessage, 'Complaint submitted successfully.', true);
    clearComplaintForm();
    setTimeout(() => {
        loadDashboard();
    }, 700);
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const detectLocation = () => {
    const locationInput = document.getElementById('complaint-location');
    if (!navigator.geolocation) {
        showToast(complaintMessage, 'Geolocation is not available in your browser', false);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            locationInput.value = `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`;
            showToast(complaintMessage, 'Location detected successfully', true);
        },
        () => {
            showToast(complaintMessage, 'Unable to detect location', false);
        },
        { timeout: 10000 }
    );
};

const bindEvents = () => {
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('btn-show-register').addEventListener('click', () => switchScreen('register'));
    document.getElementById('btn-back-login').addEventListener('click', () => switchScreen('login'));
    document.getElementById('btn-register').addEventListener('click', handleRegister);

    if (loginIcon) {
        loginIcon.addEventListener('dblclick', () => activateAdminHint('Admin access available. Use secret credentials.'));
    }
    if (loginTitle) {
        loginTitle.addEventListener('pointerdown', () => {
            adminHintTimer = setTimeout(() => activateAdminHint('Hold detected. Enter admin secret.'), 2200);
        });
        loginTitle.addEventListener('pointerup', () => clearTimeout(adminHintTimer));
        loginTitle.addEventListener('pointerleave', () => clearTimeout(adminHintTimer));
    }

    const forgotPasswordButton = document.getElementById('forgot-password');
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener('click', () => {
            showToast(loginMessage, 'Please contact support for password help.', true);
        });
    }

    const openComplaintScreen = () => {
        switchScreen('complaint');
        const nameField = document.getElementById('complaint-name');
        if (nameField) nameField.value = state.currentUser?.name || '';
    };

    document.getElementById('btn-new-complaint').addEventListener('click', openComplaintScreen);
    document.getElementById('btn-quick-report').addEventListener('click', openComplaintScreen);
    document.getElementById('btn-quick-status').addEventListener('click', () => {
        renderStatusList();
        switchScreen('status');
        activateNavButton('nav-status');
    });
    document.getElementById('btn-quick-profile').addEventListener('click', () => {
        renderProfile();
        switchScreen('profile');
        activateNavButton('nav-profile');
    });
    document.getElementById('btn-quick-about-app').addEventListener('click', () => switchScreen('about'));
    document.getElementById('btn-quick-about-town').addEventListener('click', () => switchScreen('about'));
    document.getElementById('btn-post-complaint').addEventListener('click', handleFeedPost);
    document.getElementById('nav-home').addEventListener('click', loadDashboard);
    document.getElementById('nav-add').addEventListener('click', openComplaintScreen);
    document.getElementById('nav-status').addEventListener('click', () => {
        renderStatusList();
        switchScreen('status');
        activateNavButton('nav-status');
    });
    document.getElementById('nav-profile').addEventListener('click', () => {
        renderProfile();
        switchScreen('profile');
        activateNavButton('nav-profile');
    });

    ['btn-back-dashboard', 'btn-back-dashboard-2', 'btn-back-dashboard-3', 'btn-back-dashboard-4', 'btn-back-dashboard-5'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', loadDashboard);
    });

    document.getElementById('btn-submit-complaint').addEventListener('click', submitComplaint);
    document.getElementById('btn-refresh-status').addEventListener('click', renderStatusList);
    document.getElementById('btn-detect-location').addEventListener('click', detectLocation);
    document.getElementById('btn-logout').addEventListener('click', () => {
        state.currentUser = null;
        switchScreen('login');
    });
    const btnProfileLogout = document.getElementById('btn-profile-logout');
    if (btnProfileLogout) {
        btnProfileLogout.addEventListener('click', () => {
            state.currentUser = null;
            switchScreen('login');
        });
    }
};

window.addEventListener('load', () => {
    bindEvents();
    buildUsers();
    showToast(loginMessage, 'Welcome! Login or register to continue.');
    setTimeout(() => switchScreen('login'), 2500);
});
