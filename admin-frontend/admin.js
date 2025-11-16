// Configuration
const API_BASE_URL = window.location.origin.includes('localhost')
	? 'http://localhost:3001'
	: window.location.origin;

// Admin Dashboard JavaScript - Updated for Mobile-First Design
let allInvoices = [];
let filteredInvoices = [];

// Invoice pagination variables
let currentPage = 1;
let isLoadingMore = false;
let hasMorePages = true;
let invoicesPerPage = 50;
let totalInvoicesInDb = 0; // Total count from database
let totalPaidInDb = 0; // Total paid count from database
let totalUnpaidInDb = 0; // Total unpaid count from database
let totalValueInDb = 0; // Total value from database

// Modal elements
let paymentDateModal;
let paymentDateForm;
let paymentDateInput;
let currentInvoiceId = null;
let currentCheckbox = null;

// Delete modal elements
let deleteModal;
let deleteDetails;
let deleteConfirmBtn;
let deleteCancelBtn;
let deleteModalClose;
let currentDeleteId = null;

// Helper function to parse timestamp in DD/MM/YYYY format
function parseTimestamp(timestampStr) {
	if (!timestampStr) return new Date(0);

	// Handle DD/MM/YYYY HH:mm:ss format
	const parts = timestampStr.split(' ');
	if (parts.length !== 2) return new Date(timestampStr);

	const datePart = parts[0]; // DD/MM/YYYY
	const timePart = parts[1]; // HH:mm:ss

	const dateParts = datePart.split('/');
	if (dateParts.length !== 3) return new Date(timestampStr);

	const day = parseInt(dateParts[0]);
	const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-based
	const year = parseInt(dateParts[2]);

	const timeParts = timePart.split(':');
	const hours = parseInt(timeParts[0]);
	const minutes = parseInt(timeParts[1]);
	const seconds = parseInt(timeParts[2]);

	return new Date(year, month, day, hours, minutes, seconds);
}

// Authentication check
function checkAuth() {
	const isAuthenticated = localStorage.getItem('adminAuthenticated');
	if (!isAuthenticated || isAuthenticated !== 'true') {
		window.location.href = 'login.html';
		return false;
	}
	return true;
}

// Logout function
function logout() {
	localStorage.removeItem('adminAuthenticated');
	localStorage.removeItem('adminUsername');
	localStorage.removeItem('adminToken');
	localStorage.removeItem('adminRole');
	window.location.href = 'login.html';
}

// Mobile menu functionality
function initMobileMenu() {
	const navbarToggle = document.getElementById('navbarToggle');
	const sidebar = document.getElementById('sidebar');
	const sidebarOverlay = document.getElementById('sidebarOverlay');
	const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

	// Ensure sidebar is hidden by default
	if (sidebar) {
		sidebar.classList.remove('active');
	}

	if (sidebarOverlay) {
		sidebarOverlay.classList.remove('active');
	}

	if (navbarToggle && sidebar && sidebarOverlay) {
		navbarToggle.addEventListener('click', () => {
			const isActive = sidebar.classList.toggle('active');
			sidebarOverlay.classList.toggle('active');

			// Initialize theme toggle when sidebar opens (in case it wasn't ready before)
			if (isActive) {
				setTimeout(() => initThemeToggle(), 100);
			}
		});

		sidebarOverlay.addEventListener('click', () => {
			sidebar.classList.remove('active');
			sidebarOverlay.classList.remove('active');
		});
	}

	if (sidebarCloseBtn && sidebar && sidebarOverlay) {
		sidebarCloseBtn.addEventListener('click', () => {
			sidebar.classList.remove('active');
			sidebarOverlay.classList.remove('active');
		});
	}
}

// Theme toggle functionality
function initThemeToggle() {
	const themeToggle = document.getElementById('themeToggle');
	const themeSwitchLabel = document.querySelector('.theme-switch');
	const themeStatus = document.getElementById('themeStatus');

	// Check for saved theme preference or default to light mode
	const currentTheme = localStorage.getItem('theme') || 'light';
	document.documentElement.classList.toggle('dark', currentTheme === 'dark');

	// Update status indicator
	if (themeStatus) {
		themeStatus.textContent = currentTheme === 'dark' ? 'Dark' : 'Light';
	}

	if (themeToggle) {
		themeToggle.checked = currentTheme === 'dark';

		// Add event listener to both the checkbox and the label
		const toggleTheme = () => {
			const newTheme = themeToggle.checked ? 'dark' : 'light';
			document.documentElement.classList.toggle('dark', newTheme === 'dark');
			localStorage.setItem('theme', newTheme);
			if (themeStatus) {
				themeStatus.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
			}
		};

		themeToggle.addEventListener('change', toggleTheme);

		// Also add click listener to the label for better UX
		if (themeSwitchLabel) {
			themeSwitchLabel.addEventListener('click', (e) => {
				themeToggle.checked = !themeToggle.checked;
				// Trigger the change event
				themeToggle.dispatchEvent(new Event('change'));
			});
		}
	}
}
async function initDashboard() {
	if (!checkAuth()) return;

	// Set user info
	const username = localStorage.getItem('adminUsername') || 'Admin';
	const role = localStorage.getItem('adminRole') || 'admin';
	const userInfoElements = document.querySelectorAll('#userInfo, #mobileUserName');
	userInfoElements.forEach((element) => {
		if (element) element.textContent = username;
	});

	// Set sidebar profile info
	const profileNameElement = document.getElementById('profileName');
	const profileRoleElement = document.querySelector('.profile-role');
	if (profileNameElement) {
		profileNameElement.textContent = username;
	}
	if (profileRoleElement) {
		// Capitalize first letter of role
		const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
		profileRoleElement.textContent = capitalizedRole;
	}

	// Hide Users menu if not super admin
	const usersNavItem = document.querySelector('[data-page="users"]');
	if (usersNavItem && !isSuperAdmin()) {
		usersNavItem.style.display = 'none';
	}

	// Initialize mobile menu first
	initMobileMenu();

	// Initialize sidebar navigation (sets/removes active classes)
	initSidebarNav();

	// Initialize theme toggle after a short delay to ensure DOM is ready
	setTimeout(() => {
		initThemeToggle();
	}, 100);

	// Load invoices
	await loadInvoices();

	// Initialize infinite scroll
	initInfiniteScroll();

	// Show dashboard sections by default
	showSection('dashboard');

	// Setup event listeners
	setupEventListeners();
}

// Load invoices from backend
async function loadInvoices(loadMore = false) {
	try {
		if (isLoadingMore && loadMore) return; // Prevent multiple simultaneous loads

		showLoading(true);
		if (loadMore) {
			isLoadingMore = true;
			// Show loading indicator for infinite scroll
			const loadingIndicator = document.getElementById('loading-more');
			loadingIndicator.style.display = 'flex';
		} else {
			// Reset for initial load
			currentPage = 1;
			hasMorePages = true;
			allInvoices = [];
		}

		const token = localStorage.getItem('adminToken');
		const response = await fetch(
			`${API_BASE_URL}/api/invoices/paginated?page=${currentPage}&limit=${invoicesPerPage}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		const newInvoices = data.invoices;

		// Update pagination info
		hasMorePages = data.pagination.hasNextPage;
		totalInvoicesInDb = data.pagination.totalInvoices; // Store total count from DB
		totalPaidInDb = data.pagination.totalPaid; // Store paid count from DB
		totalUnpaidInDb = data.pagination.totalUnpaid; // Store unpaid count from DB
		totalValueInDb = data.pagination.totalValue; // Store total value from DB

		if (loadMore) {
			// Append new invoices
			allInvoices = [...allInvoices, ...newInvoices];
		} else {
			// Replace all invoices
			allInvoices = newInvoices;
		}

		filteredInvoices = [...allInvoices];

		renderInvoices(loadMore);
		updateStats();

		if (loadMore) {
			currentPage++;
			isLoadingMore = false;
			// Hide loading indicator after loading more
			const loadingIndicator = document.getElementById('loading-more');
			loadingIndicator.style.display = 'none';
		}
	} catch (error) {
		console.error('Error loading invoices:', error);
		showToast('Gagal memuat data invoice. Pastikan Anda login.', 'error');
		isLoadingMore = false;
		// Hide loading indicator on error
		const loadingIndicator = document.getElementById('loading-more');
		loadingIndicator.style.display = 'none';
	} finally {
		showLoading(false);
	}
}

// Initialize infinite scroll
function initInfiniteScroll() {
	const invoiceList = document.getElementById('invoiceList');

	if (!invoiceList) return;

	const observer = new IntersectionObserver(
		(entries) => {
			const target = entries[0];
			if (target.isIntersecting && hasMorePages && !isLoadingMore) {
				loadInvoices(true); // Load more invoices
			}
		},
		{
			root: null,
			rootMargin: '100px', // Start loading 100px before the target is visible
			threshold: 0.1,
		}
	);

	// Function to observe the last invoice item
	function observeLastInvoice() {
		// Disconnect previous observations
		observer.disconnect();

		const invoiceCards = document.querySelectorAll('.invoice-card');
		if (invoiceCards.length > 0 && hasMorePages) {
			const lastInvoice = invoiceCards[invoiceCards.length - 1];
			observer.observe(lastInvoice);
		}
	}

	// Re-observe after new content is loaded
	const originalRenderInvoices = renderInvoices;
	renderInvoices = function (append = false) {
		originalRenderInvoices.call(this, append);
		// After rendering, observe the new last invoice item
		setTimeout(observeLastInvoice, 100);
	};

	// Initial observation after first load
	setTimeout(observeLastInvoice, 500);
}

// Render invoice list
function renderInvoices(append = false) {
	const invoiceList = document.getElementById('invoiceList');
	const noInvoices = document.getElementById('noInvoices');

	if (filteredInvoices.length === 0 && !append) {
		invoiceList.innerHTML = '';
		noInvoices.style.display = 'block';
		return;
	}

	noInvoices.style.display = 'none';

	const invoiceHTML = filteredInvoices
		.map(
			(invoice) => `
        <div class="invoice-card ${invoice.paid ? 'paid' : 'unpaid'}" data-id="${invoice.id}">
            <div class="invoice-card-header">
                <div class="supplier-info">
                    <div class="supplier-name">${invoice.supplier}</div>
                    <div class="supplier-branch">${invoice.branch}</div>
                </div>
                <div class="status-badge status-${invoice.paid ? 'paid' : 'unpaid'}">
                    <i class="cil ${invoice.paid ? 'cil-check' : 'cil-clock'} status-icon"></i>
                    <span>${invoice.paid ? 'Lunas' : 'Belum Dibayar'}</span>
                </div>
            </div>

            <div class="invoice-card-body">
                <div class="invoice-primary-info">
                    <div class="invoice-number-section">
                        <div class="info-label">No. Faktur</div>
                        <div class="invoice-number">${invoice.invoiceNumber}</div>
                    </div>
                    <div class="invoice-amount-section">
                        <div class="info-label">Total</div>
                        <div class="invoice-amount">Rp ${formatCurrency(parseFloat(invoice.total))}</div>
                    </div>
                </div>

                <div class="invoice-secondary-info">
                    <div class="info-row">
                        <span class="info-label">Tanggal:</span>
                        <span class="info-value">${formatDate(invoice.date)}</span>
                    </div>
                    ${
											invoice.paymentDate
												? `
                    <div class="info-row">
                        <span class="info-label">Dibayar:</span>
                        <span class="info-value">${invoice.paymentDate}</span>
                    </div>
                    `
												: ''
										}
                </div>

                ${
									invoice.description
										? `
                    <div class="invoice-description">
                        <div class="info-label">Catatan:</div>
                        <div class="description-text">${invoice.description}</div>
                    </div>
                `
										: ''
								}
            </div>

            <div class="invoice-card-actions">
                <div class="payment-toggle" data-id="${invoice.id}">
                    <input type="checkbox" class="payment-checkbox" data-id="${invoice.id}" ${
				invoice.paid ? 'checked' : ''
			}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">${
											invoice.paid ? 'Tandai Belum Dibayar' : 'Tandai Sudah Dibayar'
										}</span>
                </div>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${invoice.id}" title="Hapus Invoice">
                    <i class="cil-trash btn-icon"></i>
                </button>
            </div>
        </div>
    `
		)
		.join('');

	if (append) {
		invoiceList.innerHTML += invoiceHTML;
	} else {
		invoiceList.innerHTML = invoiceHTML;
	}

	// Hide loading indicator by default - it will be shown only during loading
	const loadingIndicator = document.getElementById('loading-more');
	loadingIndicator.style.display = 'none';
}

// Update payment status
async function togglePaymentStatus(invoiceId, isPaid) {
	try {
		const token = localStorage.getItem('adminToken');
		const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ paid: isPaid, paymentDate: isPaid ? undefined : '' }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Refresh invoice list from server instead of updating local data
		await loadInvoices();
		showToast(`Invoice ${isPaid ? 'ditandai lunas' : 'ditandai belum dibayar'}`);
	} catch (error) {
		console.error('Error updating payment status:', error);
		showToast('Gagal mengupdate status pembayaran', 'error');

		// Revert checkbox
		const checkbox = document.querySelector(`[data-id="${invoiceId}"] .invoice-checkbox`);
		if (checkbox) {
			checkbox.checked = !isPaid;
		}
	}
}

// Show delete confirmation modal
function showDeleteModal(invoiceId) {
	const invoice = allInvoices.find((inv) => inv.id === invoiceId);
	if (!invoice) {
		showToast('Invoice tidak ditemukan', 'error');
		return;
	}

	currentDeleteId = invoiceId;

	// Populate invoice details
	deleteDetails.innerHTML = `
		<p><span class="detail-label">No. Faktur:</span> <span class="detail-value">${invoice.invoiceNumber}</span></p>
		<p><span class="detail-label">Supplier:</span> <span class="detail-value">${invoice.supplier}</span></p>
		<p><span class="detail-label">Cabang:</span> <span class="detail-value">${invoice.branch}</span></p>
		<p><span class="detail-label">Total:</span> <span class="detail-value">Rp ${formatCurrency(
			parseFloat(invoice.total)
		)}</span></p>
		<p><span class="detail-label">Tanggal:</span> <span class="detail-value">${formatDate(invoice.date)}</span></p>
		<p><span class="detail-label">Status:</span> <span class="detail-value">${
			invoice.paid ? 'Lunas' : 'Belum Dibayar'
		}</span></p>
	`;

	deleteModal.style.display = 'block';
}

// Hide delete modal
function hideDeleteModal() {
	deleteModal.style.display = 'none';
	currentDeleteId = null;
}

// Confirm delete action
async function confirmDelete() {
	if (!currentDeleteId) return;

	try {
		const token = localStorage.getItem('adminToken');
		const response = await fetch(`${API_BASE_URL}/api/invoices/${currentDeleteId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		hideDeleteModal();
		await loadInvoices();
		showToast('Invoice berhasil dihapus');
	} catch (error) {
		console.error('Error deleting invoice:', error);
		showToast('Gagal menghapus invoice', 'error');
	}
}

// Show delete user confirmation modal
function showDeleteUserModal(username) {
	if (confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
		deleteUser(username);
	}
}

// Delete user
async function deleteUser(username) {
	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/auth/users/${encodeURIComponent(username)}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.ok) {
			showToast('User berhasil dihapus', 'success');
			loadUsers(); // Reload users list
		} else {
			const data = await response.json();
			showToast(data.message || 'Gagal menghapus user', 'error');
		}
	} catch (error) {
		console.error('Error deleting user:', error);
		showToast('Terjadi kesalahan saat menghapus user', 'error');
	}
}

// Update statistics
function updateStats() {
	// Use database-wide stats
	document.getElementById('totalInvoices').textContent = totalInvoicesInDb;
	document.getElementById('paidInvoices').textContent = totalPaidInDb;
	document.getElementById('unpaidInvoices').textContent = totalUnpaidInDb;
	document.getElementById('totalValue').textContent = `Rp ${formatCurrency(totalValueInDb)}`;
}

// Setup event listeners
function initSidebarNav() {
	const navLinks = document.querySelectorAll('.nav-link');
	if (!navLinks || navLinks.length === 0) return;

	// Determine current page: prefer stored value, then hash, then default to 'dashboard'
	let currentPage =
		localStorage.getItem('adminCurrentPage') || (location.hash ? location.hash.replace('#', '') : 'dashboard');

	navLinks.forEach((link) => {
		const page = link.dataset.page;
		if (page === currentPage) {
			link.classList.add('active');
		} else {
			link.classList.remove('active');
		}

		link.addEventListener('click', (e) => {
			e.preventDefault();
			// Update active class
			navLinks.forEach((l) => l.classList.remove('active'));
			link.classList.add('active');
			// Remember current page
			if (page) localStorage.setItem('adminCurrentPage', page);

			// Close mobile sidebar when a nav item is chosen
			const sidebar = document.getElementById('sidebar');
			const overlay = document.getElementById('sidebarOverlay');
			if (sidebar) sidebar.classList.remove('active');
			if (overlay) overlay.classList.remove('active');

			// TODO: hook into your page rendering/router here if needed (e.g., showPage(page))
		});
	});
}

function setupEventListeners() {
	// Prevent any form submissions that might cause page refresh
	document.addEventListener('submit', (e) => {
		e.preventDefault();
	});

	// Debug beforeunload
	window.addEventListener('beforeunload', (e) => {
		// Page unload logging removed for production
	});

	// Debug errors
	window.addEventListener('error', (e) => {
		console.error('JavaScript error detected:', e.error);
	});

	window.addEventListener('unhandledrejection', (e) => {
		console.error('Unhandled promise rejection:', e.reason);
	});

	// Debug click events on payment toggles - now handled by onclick
	// document.addEventListener('click', (e) => {
	// 	if (e.target.closest('.payment-toggle') || e.target.classList.contains('payment-toggle')) {
	// 		console.log('Click on payment-toggle detected', e.target);
	// 		e.preventDefault(); // Prevent any default behavior that might cause refresh
	// 		handleInvoiceToggle(e); // Call the handler directly
	// 	}
	// }, true); // Use capture phase to prevent before bubbling

	// Logout (desktop)
	const logoutBtn = document.getElementById('logoutBtn');
	if (logoutBtn) {
		logoutBtn.addEventListener('click', logout);
	}

	// Refresh button
	const refreshBtn = document.getElementById('refreshBtn');
	if (refreshBtn) {
		refreshBtn.addEventListener('click', () => loadInvoices());
	}

	// Search
	const searchInput = document.getElementById('searchInput');
	if (searchInput) {
		searchInput.addEventListener('input', performSearch);
		searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') performSearch();
		});
	}

	// Sort
	const sortSelect = document.getElementById('sortSelect');
	if (sortSelect) {
		// Event listener is handled by onchange attribute in HTML
	} else {
		console.log('Sort select not found!');
	}

	// Filter
	const statusFilter = document.getElementById('statusFilter');
	if (statusFilter) {
		statusFilter.addEventListener('change', performFilter);
	}

	// Invoice list click handlers (for payment toggles and delete buttons)
	const invoiceList = document.getElementById('invoiceList');
	if (invoiceList) {
		invoiceList.addEventListener('click', handleInvoiceToggle);
	}

	// Navigation links
	const navLinks = document.querySelectorAll('.nav-link');
	navLinks.forEach((link) => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const page = link.dataset.page;
			showSection(page);
		});
	});

	// Users management
	const addUserBtn = document.getElementById('addUserBtn');
	if (addUserBtn) {
		addUserBtn.addEventListener('click', showAddUserForm);
	}

	const closeUserForm = document.getElementById('closeUserForm');
	if (closeUserForm) {
		closeUserForm.addEventListener('click', hideAddUserForm);
	}

	const cancelUserBtn = document.getElementById('cancelUserBtn');
	if (cancelUserBtn) {
		cancelUserBtn.addEventListener('click', hideAddUserForm);
	}

	const userForm = document.getElementById('userForm');
	if (userForm) {
		userForm.addEventListener('submit', handleAddUser);
	}

	// Close form when clicking outside
	const addUserForm = document.getElementById('addUserForm');
	if (addUserForm) {
		addUserForm.addEventListener('click', (e) => {
			if (e.target === addUserForm) {
				hideAddUserForm();
			}
		});
	}

	// Settings event listeners
	const changePasswordBtn = document.getElementById('changePasswordBtn');
	if (changePasswordBtn) {
		changePasswordBtn.addEventListener('click', showChangePasswordForm);
	}

	const closePasswordForm = document.getElementById('closePasswordForm');
	if (closePasswordForm) {
		closePasswordForm.addEventListener('click', hideChangePasswordForm);
	}

	const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
	if (cancelPasswordBtn) {
		cancelPasswordBtn.addEventListener('click', hideChangePasswordForm);
	}

	const changePasswordForm = document.getElementById('changePasswordForm');
	if (changePasswordForm) {
		changePasswordForm.addEventListener('submit', handleChangePassword);
	}

	const themeSelect = document.getElementById('themeSelect');
	if (themeSelect) {
		themeSelect.addEventListener('change', handleThemeChange);
	}

	const languageSelect = document.getElementById('languageSelect');
	if (languageSelect) {
		languageSelect.addEventListener('change', handleLanguageChange);
	}

	const deleteAccountBtn = document.getElementById('deleteAccountBtn');
	if (deleteAccountBtn) {
		deleteAccountBtn.addEventListener('click', handleDeleteAccount);
	}

	// Suppliers management
	const addSupplierBtn = document.getElementById('addSupplierBtn');
	if (addSupplierBtn) {
		addSupplierBtn.addEventListener('click', showAddSupplierForm);
	}

	const closeSupplierForm = document.getElementById('closeSupplierForm');
	if (closeSupplierForm) {
		closeSupplierForm.addEventListener('click', hideAddSupplierForm);
	}

	const cancelSupplierBtn = document.getElementById('cancelSupplierBtn');
	if (cancelSupplierBtn) {
		cancelSupplierBtn.addEventListener('click', hideAddSupplierForm);
	}

	const supplierForm = document.getElementById('supplierForm');
	if (supplierForm) {
		supplierForm.addEventListener('submit', handleAddSupplier);
	}

	// Close form when clicking outside
	const addSupplierForm = document.getElementById('addSupplierForm');
	if (addSupplierForm) {
		addSupplierForm.addEventListener('click', (e) => {
			if (e.target === addSupplierForm) {
				hideAddSupplierForm();
			}
		});
	}

	// Supplier search
	const supplierSearchInput = document.getElementById('supplierSearchInput');
	if (supplierSearchInput) {
		supplierSearchInput.addEventListener('input', performSupplierSearch);
		supplierSearchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') performSupplierSearch();
		});
	}
}

// Handle invoice payment toggle and delete
function handleInvoiceToggle(e) {
	try {
		e.preventDefault();
		e.stopPropagation(); // Prevent event bubbling
		const target = e.target;

		if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
			const deleteBtn = target.classList.contains('delete-btn') ? target : target.closest('.delete-btn');
			const invoiceId = deleteBtn.dataset.id;
			showDeleteModal(invoiceId);
		} else if (target.classList.contains('payment-checkbox')) {
			const invoiceId = parseInt(target.dataset.id);
			const isPaid = target.checked;
			if (isPaid) {
				// Marking as paid, show modal first
				showPaymentDateModal(invoiceId, target);
			} else {
				// Marking as unpaid, proceed directly
				togglePaymentStatus(invoiceId, isPaid);
			}
		} else if (target.classList.contains('payment-toggle') || target.closest('.payment-toggle')) {
			// If clicked on toggle div or its children (except checkbox), find the checkbox and toggle it
			const toggleDiv = target.classList.contains('payment-toggle') ? target : target.closest('.payment-toggle');
			if (toggleDiv && !target.classList.contains('payment-checkbox')) {
				const checkbox = toggleDiv.querySelector('.payment-checkbox');
				if (checkbox) {
					const wasChecked = checkbox.checked;
					const intendedChecked = !wasChecked;
					if (intendedChecked) {
						// Marking as paid, show modal first
						showPaymentDateModal(parseInt(checkbox.dataset.id), checkbox);
					} else {
						// Marking as unpaid, proceed directly
						checkbox.checked = intendedChecked;
						togglePaymentStatus(parseInt(checkbox.dataset.id), intendedChecked);
					}
				}
			}
		}
	} catch (error) {
		console.error('Error in handleInvoiceToggle:', error);
	}
} // Perform search
function performSearch() {
	const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

	if (!searchTerm) {
		filteredInvoices = [...allInvoices];
	} else {
		filteredInvoices = allInvoices.filter(
			(invoice) =>
				invoice.supplier.toLowerCase().includes(searchTerm) ||
				invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
				invoice.branch.toLowerCase().includes(searchTerm) ||
				invoice.description.toLowerCase().includes(searchTerm)
		);
	}

	performSort();
	renderInvoices();
}

// Perform sort
function performSort() {
	const sortValue = document.getElementById('sortSelect').value;

	filteredInvoices.sort((a, b) => {
		switch (sortValue) {
			case 'timestamp-desc':
				return parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp);
			case 'timestamp-asc':
				return parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp);
			case 'date-desc':
				return new Date(b.date) - new Date(a.date);
			case 'date-asc':
				return new Date(a.date) - new Date(b.date);
			case 'supplier-asc':
				return a.supplier.localeCompare(b.supplier);
			case 'supplier-desc':
				return b.supplier.localeCompare(a.supplier);
			case 'status':
				if (a.paid === b.paid) return 0;
				return a.paid ? 1 : -1;
			default:
				// Default sort by timestamp descending
				return parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp);
		}
	});

	renderInvoices();
}

// Make performSort globally accessible
window.performSort = performSort;

// Perform filter
async function performFilter() {
	const filterValue = document.getElementById('statusFilter').value;

	// If we don't have all invoices loaded yet, load them for filtering
	if (hasMorePages && allInvoices.length < 7044) {
		// Assuming we know total count
		await loadAllInvoicesForFilter();
	}

	if (filterValue === 'all') {
		filteredInvoices = [...allInvoices];
	} else {
		const isPaid = filterValue === 'paid';
		filteredInvoices = allInvoices.filter((invoice) => invoice.paid === isPaid);
	}

	performSort();
	renderInvoices();
}

// Load all invoices for filtering (bypasses pagination)
async function loadAllInvoicesForFilter() {
	try {
		showLoading(true);
		const token = localStorage.getItem('adminToken');
		const response = await fetch(`${API_BASE_URL}/api/invoices`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		allInvoices = await response.json();
		// Sort by timestamp (newest first)
		allInvoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
		hasMorePages = false; // Mark as all loaded
	} catch (error) {
		console.error('Error loading all invoices for filter:', error);
		showToast('Gagal memuat data untuk filter.', 'error');
	} finally {
		showLoading(false);
	}
}

// Utility functions
function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function formatCurrency(amount) {
	return amount.toLocaleString('id-ID', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
}

function showLoading(show) {
	const spinner = document.getElementById('loadingSpinner');
	const list = document.getElementById('invoiceList');

	if (show) {
		spinner.style.display = 'block';
		list.style.display = 'none';
	} else {
		spinner.style.display = 'none';
		list.style.display = 'block';
	}
}

function showToast(message, type = 'success') {
	const toast = document.getElementById('toast');
	const toastMessage = document.getElementById('toastMessage');

	toastMessage.textContent = message;
	toast.className = `toast ${type} show`;

	setTimeout(() => {
		toast.classList.remove('show');
	}, 3000);
}

// ===========================================
// USERS MANAGEMENT FUNCTIONS
// ===========================================

let allUsers = [];

// Check if current user is super admin (has admin role)
function isSuperAdmin() {
	const role = localStorage.getItem('adminRole');
	return role === 'admin';
}

// Get current username from token
function getCurrentUsername() {
	try {
		const token = localStorage.getItem('adminToken');
		if (!token) return null;

		const payload = JSON.parse(atob(token.split('.')[1]));
		return payload.username;
	} catch (error) {
		return null;
	}
}

// Check if dashboard is currently displayed
function isDashboardDisplayed() {
	const dashboardSection = document.getElementById('dashboardSection');
	const statsSection = document.getElementById('statsSection');
	const filtersSection = document.getElementById('filtersSection');
	const invoiceSection = document.getElementById('invoiceSection');

	return (
		dashboardSection &&
		statsSection &&
		filtersSection &&
		invoiceSection &&
		dashboardSection.style.display !== 'none' &&
		statsSection.style.display !== 'none' &&
		filtersSection.style.display !== 'none' &&
		invoiceSection.style.display !== 'none'
	);
}

// Scroll to a specific section
function scrollToSection(sectionId) {
	const section = document.getElementById(sectionId);
	if (section) {
		section.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		});
	}
}

// Close sidebar
function closeSidebar() {
	const sidebar = document.getElementById('sidebar');
	const sidebarOverlay = document.getElementById('sidebarOverlay');

	if (sidebar && sidebarOverlay) {
		sidebar.classList.remove('active');
		sidebarOverlay.classList.remove('active');
	}
}

// Show/hide sections based on navigation
function showSection(sectionName) {
	// Special handling for invoices - if on dashboard, just scroll; otherwise show dashboard and scroll
	if (sectionName === 'invoices') {
		if (isDashboardDisplayed()) {
			// Already on dashboard, just scroll to invoices section and close sidebar
			scrollToSection('invoiceSection');
			closeSidebar();
			// Keep dashboard as active link
			return;
		} else {
			// Not on dashboard, show dashboard first
			showDashboardAndScroll('invoiceSection');
			return;
		}
	}

	// If moving away from dashboard, scroll to top
	if (sectionName !== 'dashboard' && isDashboardDisplayed()) {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Hide all sections
	document.querySelectorAll('.main-content > section').forEach((section) => {
		section.style.display = 'none';
	});

	// Special handling for dashboard - show all dashboard sections
	if (sectionName === 'dashboard') {
		document.getElementById('dashboardSection').style.display = 'block';
		document.getElementById('statsSection').style.display = 'block';
		document.getElementById('filtersSection').style.display = 'block';
		document.getElementById('invoiceSection').style.display = 'block';
		// Always scroll to top when showing dashboard
		window.scrollTo({ top: 0, behavior: 'smooth' });
	} else {
		// Show selected section
		const targetSection = document.getElementById(sectionName + 'Section');
		if (targetSection) {
			targetSection.style.display = 'block';
		}
	}

	// Update active nav link
	document.querySelectorAll('.nav-link').forEach((link) => {
		link.classList.remove('active');
	});
	const activeLink = document.querySelector(`[data-page="${sectionName}"]`);
	if (activeLink) {
		activeLink.classList.add('active');
	}

	// Load data based on section
	if (sectionName === 'users') {
		loadUsers();
	} else if (sectionName === 'dashboard' || sectionName === 'invoices') {
		loadInvoices();
	} else if (sectionName === 'settings') {
		loadSettings();
	} else if (sectionName === 'suppliers') {
		loadSuppliers();
	}
}

// Show dashboard and scroll to specific section
function showDashboardAndScroll(targetSectionId) {
	// Hide all sections
	document.querySelectorAll('.main-content > section').forEach((section) => {
		section.style.display = 'none';
	});

	// Show all dashboard sections
	document.getElementById('dashboardSection').style.display = 'block';
	document.getElementById('statsSection').style.display = 'block';
	document.getElementById('filtersSection').style.display = 'block';
	document.getElementById('invoiceSection').style.display = 'block';

	// Update active nav link to dashboard
	document.querySelectorAll('.nav-link').forEach((link) => {
		link.classList.remove('active');
	});
	const dashboardLink = document.querySelector('[data-page="dashboard"]');
	if (dashboardLink) {
		dashboardLink.classList.add('active');
	}

	// Load invoices data
	loadInvoices();

	// Scroll to target section after a short delay to ensure DOM is updated
	setTimeout(() => {
		scrollToSection(targetSectionId);
		closeSidebar();
	}, 100);
}

// Load users from API
async function loadUsers() {
	try {
		showUsersLoading(true);

		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/auth/users`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error('Gagal memuat users');
		}

		const data = await response.json();
		allUsers = data.users || [];
		renderUsers();
	} catch (error) {
		console.error('Error loading users:', error);
		showToast('Gagal memuat data users', 'error');
	} finally {
		showUsersLoading(false);
	}
}

// Render users list
function renderUsers() {
	const usersList = document.getElementById('usersList');
	const noUsers = document.getElementById('noUsers');

	if (allUsers.length === 0) {
		usersList.innerHTML = '';
		noUsers.style.display = 'block';
		return;
	}

	noUsers.style.display = 'none';

	const usersHTML = allUsers
		.map((user) => {
			const isCurrentUser = user.username === getCurrentUsername();
			const canDelete = isSuperAdmin() && !isCurrentUser;

			return `
		<div class="user-item">
			<div class="user-info">
				<div class="user-name">${user.username}</div>
				<div class="user-role ${user.role}">${user.role === 'admin' ? 'Administrator' : 'User'}</div>
				<div class="user-created">Dibuat: ${new Date(user.createdAt).toLocaleDateString('id-ID')}</div>
			</div>
			${
				canDelete
					? `
			<div class="user-actions">
				<button class="btn btn-danger btn-sm delete-user-btn" data-username="${user.username}" title="Hapus User">
					<i class="cil-trash btn-icon"></i>
				</button>
			</div>
			`
					: ''
			}
		</div>
	`;
		})
		.join('');

	usersList.innerHTML = usersHTML;

	// Add event listeners for delete buttons
	document.querySelectorAll('.delete-user-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const username = e.target.closest('.delete-user-btn').dataset.username;
			showDeleteUserModal(username);
		});
	});
}

// Show/hide users loading state
function showUsersLoading(show) {
	const spinner = document.getElementById('usersLoadingSpinner');
	const list = document.getElementById('usersList');

	if (show) {
		spinner.style.display = 'block';
		list.style.display = 'none';
	} else {
		spinner.style.display = 'none';
		list.style.display = 'block';
	}
}

// Show add user form
function showAddUserForm() {
	if (!isSuperAdmin()) {
		showToast('Hanya super admin yang dapat menambah user', 'error');
		return;
	}
	document.getElementById('addUserForm').style.display = 'flex';
}

// Hide add user form
function hideAddUserForm() {
	document.getElementById('addUserForm').style.display = 'none';
	document.getElementById('userForm').reset();
}

// Handle add user form submission
async function handleAddUser(e) {
	e.preventDefault();

	if (!isSuperAdmin()) {
		showToast('Hanya super admin yang dapat menambah user', 'error');
		return;
	}

	const formData = new FormData(e.target);
	const userData = {
		username: formData.get('username'),
		password: formData.get('password'),
		role: formData.get('role'),
	};

	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(userData),
		});

		const data = await response.json();

		if (response.ok) {
			showToast('User berhasil ditambahkan', 'success');
			hideAddUserForm();
			loadUsers(); // Reload users list
		} else {
			showToast(data.message || 'Gagal menambah user', 'error');
		}
	} catch (error) {
		console.error('Error adding user:', error);
		showToast('Terjadi kesalahan saat menambah user', 'error');
	}
}

// ===========================================
// SETTINGS FUNCTIONS
// ===========================================

// Load user profile information
async function loadUserProfile() {
	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		// Decode token to get username
		const payload = JSON.parse(atob(token.split('.')[1]));
		const currentUsername = payload.username;

		// Fetch all users to get current user's data
		const response = await fetch(`${API_BASE_URL}/auth/users`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error('Gagal memuat data user');
		}

		const data = await response.json();
		const currentUser = data.users.find((user) => user.username === currentUsername);

		if (currentUser) {
			document.getElementById('currentUsername').textContent = currentUser.username || 'Unknown';
			document.getElementById('currentRole').textContent = currentUser.role === 'admin' ? 'Administrator' : 'User';
			document.getElementById('accountCreated').textContent = currentUser.createdAt
				? new Date(currentUser.createdAt).toLocaleDateString('id-ID')
				: 'Unknown';
		} else {
			// Fallback to token data if user not found
			document.getElementById('currentUsername').textContent = payload.username || 'Unknown';
			document.getElementById('currentRole').textContent = payload.role === 'admin' ? 'Administrator' : 'User';
			document.getElementById('accountCreated').textContent = 'Unknown';
		}
	} catch (error) {
		console.error('Error loading user profile:', error);
		showToast('Gagal memuat profil user', 'error');
	}
}

// Load settings
function loadSettings() {
	// Load theme setting
	const currentTheme = localStorage.getItem('theme') || 'light';
	document.getElementById('themeSelect').value = currentTheme;

	// Load language setting (default to Indonesian)
	const currentLanguage = localStorage.getItem('language') || 'id';
	document.getElementById('languageSelect').value = currentLanguage;

	// Load user profile
	loadUserProfile();
}

// Show change password form
function showChangePasswordForm() {
	document.getElementById('changePasswordForm').style.display = 'flex';
}

// Hide change password form
function hideChangePasswordForm() {
	document.getElementById('changePasswordForm').style.display = 'none';
	document.getElementById('passwordForm').reset();
}

// Handle change password form submission
async function handleChangePassword(e) {
	e.preventDefault();

	const formData = new FormData(e.target);
	const currentPassword = formData.get('currentPassword');
	const newPassword = formData.get('newPassword');
	const confirmPassword = formData.get('confirmPassword');

	// Validate passwords
	if (newPassword !== confirmPassword) {
		showToast('Password baru dan konfirmasi tidak cocok', 'error');
		return;
	}

	if (newPassword.length < 6) {
		showToast('Password baru minimal 6 karakter', 'error');
		return;
	}

	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				currentPassword,
				newPassword,
			}),
		});

		const data = await response.json();

		if (response.ok) {
			showToast('Password berhasil diubah', 'success');
			hideChangePasswordForm();
		} else {
			showToast(data.message || 'Gagal mengubah password', 'error');
		}
	} catch (error) {
		console.error('Error changing password:', error);
		showToast('Terjadi kesalahan saat mengubah password', 'error');
	}
}

// Handle theme change
function handleThemeChange(e) {
	const selectedTheme = e.target.value;

	if (selectedTheme === 'auto') {
		// Auto theme based on system preference
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.classList.toggle('dark', prefersDark);
		localStorage.setItem('theme', 'auto');
	} else {
		// Manual theme
		document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
		localStorage.setItem('theme', selectedTheme);
	}

	// Update theme status indicator
	const themeStatus = document.getElementById('themeStatus');
	if (themeStatus) {
		const displayTheme =
			selectedTheme === 'auto'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'Dark'
					: 'Light'
				: selectedTheme === 'dark'
				? 'Dark'
				: 'Light';
		themeStatus.textContent = displayTheme;
	}

	showToast(`Tema diubah ke ${selectedTheme === 'auto' ? 'otomatis' : selectedTheme}`, 'success');
}

// Handle language change
function handleLanguageChange(e) {
	const selectedLanguage = e.target.value;
	localStorage.setItem('language', selectedLanguage);

	const languageName = selectedLanguage === 'id' ? 'Bahasa Indonesia' : 'English';
	showToast(`Bahasa diubah ke ${languageName}`, 'success');

	// Note: Actual language switching would require i18n implementation
	// For now, just save the preference
}

// Handle delete account
async function handleDeleteAccount() {
	if (
		!confirm(
			'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan dan semua data Anda akan hilang.'
		)
	) {
		return;
	}

	// Prompt for password confirmation
	const password = prompt('Masukkan password Anda untuk konfirmasi penghapusan akun:');
	if (!password) {
		showToast('Password diperlukan untuk menghapus akun', 'error');
		return;
	}

	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				password,
			}),
		});

		if (response.ok) {
			showToast('Akun berhasil dihapus', 'success');
			// Logout user
			setTimeout(() => {
				logout();
			}, 2000);
		} else {
			const data = await response.json();
			showToast(data.message || 'Gagal menghapus akun', 'error');
		}
	} catch (error) {
		console.error('Error deleting account:', error);
		showToast('Terjadi kesalahan saat menghapus akun', 'error');
	}
}

// ===========================================
// SUPPLIERS MANAGEMENT FUNCTIONS
// ===========================================

let allSuppliers = [];
let filteredSuppliers = [];

// Load suppliers from API
async function loadSuppliers() {
	try {
		showSuppliersLoading(true);

		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/api/supplierList`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error('Gagal memuat suppliers');
		}

		allSuppliers = await response.json();
		filteredSuppliers = [...allSuppliers];
		renderSuppliers();
	} catch (error) {
		console.error('Error loading suppliers:', error);
		showToast('Gagal memuat data suppliers', 'error');
	} finally {
		showSuppliersLoading(false);
	}
}

// Render suppliers list
function renderSuppliers() {
	const suppliersList = document.getElementById('suppliersList');
	const noSuppliers = document.getElementById('noSuppliers');

	if (filteredSuppliers.length === 0) {
		suppliersList.innerHTML = '';
		noSuppliers.style.display = 'block';
		return;
	}

	noSuppliers.style.display = 'none';

	const suppliersHTML = filteredSuppliers
		.map(
			(supplier) => `
		<div class="supplier-item">
			<div class="supplier-info">
				<div class="supplier-name">${supplier}</div>
			</div>
			<div class="supplier-actions">
				<button class="btn btn-danger btn-sm delete-supplier-btn" data-supplier="${supplier}" title="Hapus Supplier">
					<i class="cil-trash btn-icon"></i>
				</button>
			</div>
		</div>
	`
		)
		.join('');

	suppliersList.innerHTML = suppliersHTML;

	// Add event listeners for delete buttons
	document.querySelectorAll('.delete-supplier-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const supplierName = e.target.dataset.supplier;
			showDeleteSupplierModal(supplierName);
		});
	});
}

// Perform supplier search
function performSupplierSearch() {
	const searchTerm = document.getElementById('supplierSearchInput').value.toLowerCase().trim();

	if (!searchTerm) {
		filteredSuppliers = [...allSuppliers];
	} else {
		filteredSuppliers = allSuppliers.filter((supplier) => supplier.toLowerCase().includes(searchTerm));
	}

	renderSuppliers();
}

// Show/hide suppliers loading state
function showSuppliersLoading(show) {
	const spinner = document.getElementById('suppliersLoadingSpinner');
	const list = document.getElementById('suppliersList');

	if (show) {
		if (spinner) spinner.style.display = 'block';
		if (list) list.style.display = 'none';
	} else {
		if (spinner) spinner.style.display = 'none';
		if (list) list.style.display = 'block';
	}
}

// Show add supplier form
function showAddSupplierForm() {
	document.getElementById('addSupplierForm').style.display = 'flex';
	document.getElementById('supplierName').focus();
}

// Hide add supplier form
function hideAddSupplierForm() {
	document.getElementById('addSupplierForm').style.display = 'none';
	document.getElementById('supplierForm').reset();
}

// Handle add supplier form submission
async function handleAddSupplier(e) {
	e.preventDefault();

	const formData = new FormData(e.target);
	const supplierName = formData.get('name').trim();

	if (!supplierName) {
		showToast('Nama supplier harus diisi', 'error');
		return;
	}

	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/api/supplierList`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name: supplierName }),
		});

		const data = await response.json();

		if (response.ok) {
			showToast('Supplier berhasil ditambahkan', 'success');
			hideAddSupplierForm();
			loadSuppliers(); // Reload suppliers list
		} else {
			showToast(data.message || 'Gagal menambah supplier', 'error');
		}
	} catch (error) {
		console.error('Error adding supplier:', error);
		showToast('Terjadi kesalahan saat menambah supplier', 'error');
	}
}

// Show delete supplier confirmation modal
function showDeleteSupplierModal(supplierName) {
	if (confirm(`Apakah Anda yakin ingin menghapus supplier "${supplierName}"?`)) {
		deleteSupplier(supplierName);
	}
}

// Delete supplier
async function deleteSupplier(supplierName) {
	try {
		const token = localStorage.getItem('adminToken');
		if (!token) {
			showToast('Token tidak ditemukan', 'error');
			return;
		}

		const response = await fetch(`${API_BASE_URL}/api/supplierList/${encodeURIComponent(supplierName)}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (response.ok) {
			showToast('Supplier berhasil dihapus', 'success');
			loadSuppliers(); // Reload suppliers list
		} else {
			const data = await response.json();
			showToast(data.message || 'Gagal menghapus supplier', 'error');
		}
	} catch (error) {
		console.error('Error deleting supplier:', error);
		showToast('Terjadi kesalahan saat menghapus supplier', 'error');
	}
}

// Payment date modal functions
function showPaymentDateModal(invoiceId, checkbox) {
	currentInvoiceId = invoiceId;
	currentCheckbox = checkbox;
	paymentDateModal.style.display = 'block';
	paymentDateInput.value = ''; // Clear previous value
	paymentDateInput.focus();
}

function hidePaymentDateModal() {
	paymentDateModal.style.display = 'none';
	currentInvoiceId = null;
	currentCheckbox = null;
}

// Initialize modal elements
function initModal() {
	paymentDateModal = document.getElementById('paymentDateModal');
	paymentDateForm = document.getElementById('paymentDateForm');
	paymentDateInput = document.getElementById('paymentDateInput');

	// Close modal events
	document.getElementById('paymentDateModalClose').addEventListener('click', hidePaymentDateModal);
	document.getElementById('paymentDateCancel').addEventListener('click', hidePaymentDateModal);

	// Click outside to close
	paymentDateModal.addEventListener('click', (e) => {
		if (e.target === paymentDateModal) {
			hidePaymentDateModal();
		}
	});

	// Form submit
	paymentDateForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const paymentDate = paymentDateInput.value;
		if (!paymentDate) {
			showToast('Tanggal pembayaran harus diisi', 'error');
			return;
		}

		// Format date to DD/MM/YYYY
		const date = new Date(paymentDate);
		const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
			.toString()
			.padStart(2, '0')}/${date.getFullYear()}`;

		try {
			const token = localStorage.getItem('adminToken');
			const response = await fetch(`${API_BASE_URL}/api/invoices/${currentInvoiceId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ paid: true, paymentDate: formattedDate }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			if (currentCheckbox) {
				currentCheckbox.checked = true;
			}
			hidePaymentDateModal();
			await loadInvoices();
			showToast('Invoice ditandai lunas dengan tanggal pembayaran');
		} catch (error) {
			console.error('Error updating payment status:', error);
			showToast('Gagal mengupdate status pembayaran', 'error');
		}
	});

	// Delete modal elements
	deleteModal = document.getElementById('deleteModal');
	deleteDetails = document.getElementById('deleteDetails');
	deleteConfirmBtn = document.getElementById('deleteConfirm');
	deleteCancelBtn = document.getElementById('deleteCancel');
	deleteModalClose = document.getElementById('deleteModalClose');

	// Delete modal events
	if (deleteModalClose) {
		deleteModalClose.addEventListener('click', hideDeleteModal);
	}
	if (deleteCancelBtn) {
		deleteCancelBtn.addEventListener('click', hideDeleteModal);
	}
	if (deleteConfirmBtn) {
		deleteConfirmBtn.addEventListener('click', confirmDelete);
	}

	// Click outside to close delete modal
	if (deleteModal) {
		deleteModal.addEventListener('click', (e) => {
			if (e.target === deleteModal) {
				hideDeleteModal();
			}
		});
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	initModal();
	initDashboard();
});
