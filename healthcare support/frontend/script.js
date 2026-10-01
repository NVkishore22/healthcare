// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global Variables
let currentCampId = null;
let isAdminLoggedIn = false;
let allCamps = [];

// DOM Elements
const elements = {
    // Navigation
    adminBtn: document.getElementById('adminBtn'),
    viewCampsBtn: document.getElementById('viewCampsBtn'),
    
    // Modals
    bookingModal: document.getElementById('bookingModal'),
    adminModal: document.getElementById('adminModal'),
    campModal: document.getElementById('campModal'),
    adminPanel: document.getElementById('adminPanel'),
    
    // Forms
    bookingForm: document.getElementById('bookingForm'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    campForm: document.getElementById('campForm'),
    
    // Containers
    campsContainer: document.getElementById('campsContainer'),
    adminCampsContainer: document.getElementById('adminCampsContainer'),
    adminBookingsContainer: document.getElementById('adminBookingsContainer'),
    messageContainer: document.getElementById('messageContainer'),
    
    // Search
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    
    // Admin
    logoutBtn: document.getElementById('logoutBtn'),
    addCampBtn: document.getElementById('addCampBtn'),
    
    // Tab buttons
    tabBtns: document.querySelectorAll('.tab-btn'),
    
    // Close buttons
    closeBtns: document.querySelectorAll('.close')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadCamps();
});

function initializeApp() {
    // Initialize sample data
    fetch(`${API_BASE_URL}/init`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).catch(error => console.log('Sample data already exists'));
}

function setupEventListeners() {
    // Navigation
    elements.adminBtn.addEventListener('click', () => showModal('adminModal'));
    elements.viewCampsBtn.addEventListener('click', () => {
        document.getElementById('camps').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Search
    elements.searchBtn.addEventListener('click', searchCamps);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCamps();
    });
    
    // Forms
    elements.bookingForm.addEventListener('submit', handleBookingSubmit);
    elements.adminLoginForm.addEventListener('submit', handleAdminLogin);
    elements.campForm.addEventListener('submit', handleCampSubmit);
    
    // Admin
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.addCampBtn.addEventListener('click', () => {
        currentCampId = null;
        document.getElementById('campModalTitle').textContent = 'Add New Camp';
        elements.campForm.reset();
        showModal('campModal');
    });
    
    // Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Close modals
    elements.closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showMessage(error.message, 'error');
        throw error;
    }
}

// Camp Functions
async function loadCamps() {
    try {
        showLoading(elements.campsContainer);
        const camps = await apiCall('/camps');
        allCamps = camps;
        displayCamps(camps);
    } catch (error) {
        elements.campsContainer.innerHTML = '<p>Failed to load camps. Please try again later.</p>';
    }
}

function displayCamps(camps) {
    if (camps.length === 0) {
        elements.campsContainer.innerHTML = '<p class="no-camps">No health camps available at the moment.</p>';
        return;
    }
    
    elements.campsContainer.innerHTML = camps.map(camp => `
        <div class="camp-card">
            <div class="camp-header">
                <div>
                    <div class="camp-name">${camp.name}</div>
                </div>
                <div class="camp-date">${formatDate(camp.date)}</div>
            </div>
            <div class="camp-details">
                <div class="camp-detail">
                    <i class="fas fa-clock"></i>
                    <span>${camp.time}</span>
                </div>
                <div class="camp-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${camp.location}</span>
                </div>
                <div class="camp-detail">
                    <i class="fas fa-users"></i>
                    <span>${camp.availableSlots} slots available</span>
                </div>
            </div>
            ${camp.description ? `<p class="camp-description">${camp.description}</p>` : ''}
            <div class="camp-services">
                ${camp.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
            </div>
            <button class="book-btn" onclick="openBookingModal('${camp._id}', '${camp.name}', '${camp.date}', '${camp.time}', '${camp.location}')" 
                    ${camp.availableSlots <= 0 ? 'disabled' : ''}>
                ${camp.availableSlots <= 0 ? 'Fully Booked' : 'Book Appointment'}
            </button>
        </div>
    `).join('');
}

function searchCamps() {
    const query = elements.searchInput.value.toLowerCase().trim();
    
    if (!query) {
        displayCamps(allCamps);
        return;
    }
    
    const filteredCamps = allCamps.filter(camp => 
        camp.name.toLowerCase().includes(query) ||
        camp.location.toLowerCase().includes(query) ||
        camp.services.some(service => service.toLowerCase().includes(query))
    );
    
    displayCamps(filteredCamps);
}

function openBookingModal(campId, name, date, time, location) {
    currentCampId = campId;
    document.getElementById('modalCampName').textContent = name;
    document.getElementById('modalCampDetails').textContent = `${formatDate(date)} at ${time} - ${location}`;
    elements.bookingForm.reset();
    showModal('bookingModal');
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingData = {
        campId: currentCampId,
        name: formData.get('name') || document.getElementById('name').value,
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        mobile: document.getElementById('mobile').value,
        timeSlot: document.getElementById('timeSlot').value
    };
    
    try {
        const result = await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        
        showMessage(`Booking confirmed! Your booking ID is: ${result.bookingId}`, 'success');
        elements.bookingModal.style.display = 'none';
        loadCamps(); // Refresh camps to update available slots
    } catch (error) {
        // Error already handled in apiCall
    }
}

// Admin Functions
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const credentials = {
        username: document.getElementById('adminUsername').value,
        password: document.getElementById('adminPassword').value
    };
    
    try {
        await apiCall('/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        isAdminLoggedIn = true;
        elements.adminModal.style.display = 'none';
        elements.adminPanel.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        loadAdminCamps();
        showMessage('Admin login successful', 'success');
    } catch (error) {
        // Error already handled in apiCall
    }
}

function handleLogout() {
    isAdminLoggedIn = false;
    elements.adminPanel.style.display = 'none';
    document.body.style.overflow = 'auto';
    elements.adminLoginForm.reset();
}

async function loadAdminCamps() {
    try {
        showLoading(elements.adminCampsContainer);
        const camps = await apiCall('/camps');
        displayAdminCamps(camps);
    } catch (error) {
        elements.adminCampsContainer.innerHTML = '<p>Failed to load camps.</p>';
    }
}

function displayAdminCamps(camps) {
    elements.adminCampsContainer.innerHTML = camps.map(camp => `
        <div class="admin-card">
            <div class="admin-card-header">
                <h3>${camp.name}</h3>
                <div class="admin-actions">
                    <button class="edit-btn" onclick="editCamp('${camp._id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteCamp('${camp._id}')">Delete</button>
                </div>
            </div>
            <p><strong>Date:</strong> ${formatDate(camp.date)} at ${camp.time}</p>
            <p><strong>Location:</strong> ${camp.location}</p>
            <p><strong>Services:</strong> ${camp.services.join(', ')}</p>
            <p><strong>Available Slots:</strong> ${camp.availableSlots}</p>
            ${camp.description ? `<p><strong>Description:</strong> ${camp.description}</p>` : ''}
        </div>
    `).join('');
}

async function editCamp(campId) {
    try {
        const camps = await apiCall('/camps');
        const camp = camps.find(c => c._id === campId);
        
        if (!camp) {
            showMessage('Camp not found', 'error');
            return;
        }
        
        currentCampId = campId;
        document.getElementById('campModalTitle').textContent = 'Edit Camp';
        
        // Populate form
        document.getElementById('campName').value = camp.name;
        document.getElementById('campDate').value = camp.date;
        document.getElementById('campTime').value = camp.time;
        document.getElementById('campLocation').value = camp.location;
        document.getElementById('campServices').value = camp.services.join(', ');
        document.getElementById('campDescription').value = camp.description || '';
        document.getElementById('availableSlots').value = camp.availableSlots;
        
        showModal('campModal');
    } catch (error) {
        // Error already handled in apiCall
    }
}

async function deleteCamp(campId) {
    if (!confirm('Are you sure you want to delete this camp?')) {
        return;
    }
    
    try {
        await apiCall(`/camps/${campId}`, { method: 'DELETE' });
        showMessage('Camp deleted successfully', 'success');
        loadAdminCamps();
        loadCamps(); // Refresh public view
    } catch (error) {
        // Error already handled in apiCall
    }
}

async function handleCampSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const campData = {
        name: document.getElementById('campName').value,
        date: document.getElementById('campDate').value,
        time: document.getElementById('campTime').value,
        location: document.getElementById('campLocation').value,
        services: document.getElementById('campServices').value.split(',').map(s => s.trim()),
        description: document.getElementById('campDescription').value,
        availableSlots: parseInt(document.getElementById('availableSlots').value)
    };
    
    try {
        const method = currentCampId ? 'PUT' : 'POST';
        const endpoint = currentCampId ? `/camps/${currentCampId}` : '/camps';
        
        await apiCall(endpoint, {
            method: method,
            body: JSON.stringify(campData)
        });
        
        showMessage(`Camp ${currentCampId ? 'updated' : 'created'} successfully`, 'success');
        elements.campModal.style.display = 'none';
        loadAdminCamps();
        loadCamps(); // Refresh public view
    } catch (error) {
        // Error already handled in apiCall
    }
}

async function loadAdminBookings() {
    try {
        showLoading(elements.adminBookingsContainer);
        const bookings = await apiCall('/bookings');
        displayAdminBookings(bookings);
    } catch (error) {
        elements.adminBookingsContainer.innerHTML = '<p>Failed to load bookings.</p>';
    }
}

function displayAdminBookings(bookings) {
    if (bookings.length === 0) {
        elements.adminBookingsContainer.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    
    elements.adminBookingsContainer.innerHTML = bookings.map(booking => `
        <div class="admin-card">
            <h3>${booking.name}</h3>
            <p><strong>Age:</strong> ${booking.age}</p>
            <p><strong>Gender:</strong> ${booking.gender}</p>
            <p><strong>Mobile:</strong> ${booking.mobile}</p>
            <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
            <p><strong>Booked On:</strong> ${formatDateTime(booking.createdAt)}</p>
        </div>
    `).join('');
}

// Utility Functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function switchTab(tabName) {
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
    
    // Load content based on tab
    if (tabName === 'bookings') {
        loadAdminBookings();
    }
}

function showMessage(message, type) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    elements.messageContainer.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

function showLoading(container) {
    container.innerHTML = '<div class="loading"></div>';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});