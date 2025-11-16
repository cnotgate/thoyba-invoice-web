// Configuration
const API_BASE_URL = window.location.origin.includes('localhost')
	? 'http://localhost:3001'
	: window.location.origin;

// Global variables
let supplierOptions = [];

document.getElementById('invoiceForm').addEventListener('submit', function (event) {
	console.log('Form submit prevented');

	// Disable submit button to prevent double submission
	const submitBtn = document.getElementById('submitBtn');
	submitBtn.disabled = true;
	submitBtn.textContent = 'Menyimpan...';

	// Basic validation
	const supplierValue = document.getElementById('supplierSelected').value.trim();
	const branch = document.querySelector('input[name="branch"]:checked');
	const date = document.getElementById('date').value;
	const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
	const total = document.getElementById('total').value.replace(/\./g, ''); // Remove formatting dots

	if (!supplierValue || !branch || !date || !invoiceNumber || !total) {
		showToast('Harap isi semua field yang wajib.', 'error');
		submitBtn.disabled = false;
		submitBtn.textContent = 'Simpan';
		return;
	}

	// Validate supplier is in the list
	const validSuppliers = supplierOptions.map(s => s.name || s);
	if (!validSuppliers.includes(supplierValue)) {
		showToast('Supplier tidak valid. Pilih dari dropdown yang muncul saat mengetik.', 'error');
		submitBtn.disabled = false;
		submitBtn.textContent = 'Simpan';
		return;
	}

	// Validate total format (only numbers allowed)
	const totalRegex = /^\d+$/;
	if (!totalRegex.test(total)) {
		showToast('Format total tidak valid. Masukkan hanya angka tanpa titik atau koma. Contoh: 6000000', 'error');
		submitBtn.disabled = false;
		submitBtn.textContent = 'Simpan';
		return;
	}

	// Additional validation: ensure it's a valid non-negative number
	const numericTotal = parseFloat(total);
	if (isNaN(numericTotal) || numericTotal < 0) {
		showToast('Total harus berupa angka non-negatif yang valid.', 'error');
		submitBtn.disabled = false;
		submitBtn.textContent = 'Simpan';
		return;
	}

	// If all good, submit to backend
	const invoiceData = {
		supplier: supplierValue,
		branch: branch.value,
		date: date,
		invoiceNumber: invoiceNumber,
		total: total, // Already pure numbers
		description: document.getElementById('description').value.trim(),
		timestamp: new Date().toISOString(),
		paid: false,
	};

	fetch(`${API_BASE_URL}/api/invoices`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(invoiceData),
	})
		.then((response) => {
			if (response.ok) {
				showToast('Invoice berhasil disimpan!');
				clearForm();
			} else {
				showToast('Gagal menyimpan invoice. Status: ' + response.status, 'error');
			}
		})
		.catch((error) => {
			console.error('Error:', error);
			showToast('Error menyimpan invoice. Pastikan backend berjalan.', 'error');
		})
		.finally(() => {
			submitBtn.disabled = false;
			submitBtn.textContent = 'Simpan';
		});
});

document.getElementById('invoiceNumber').addEventListener('input', function () {
	this.value = this.value.toUpperCase();
});

document.getElementById('total').addEventListener('input', function () {
	// Allow only numbers
	this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById('total').addEventListener('blur', function () {
	// Format the number for confirmation when user unfocuses
	const numericValue = parseFloat(this.value);
	if (!isNaN(numericValue) && numericValue > 0) {
		this.value = formatCurrency(numericValue);
	}
});

document.getElementById('total').addEventListener('focus', function () {
	// Remove formatting when user focuses back to edit
	const numericValue = parseFloat(this.value.replace(/\./g, ''));
	if (!isNaN(numericValue)) {
		this.value = numericValue.toString();
	}
});

document.getElementById('darkModeToggle').addEventListener('change', function () {
	document.body.classList.toggle('dark');
	const isDark = document.body.classList.contains('dark');
	document.getElementById('sunIcon').style.display = isDark ? 'none' : 'block';
	document.getElementById('moonIcon').style.display = isDark ? 'block' : 'none';
	localStorage.setItem('darkMode', isDark);
});

// Load dark mode preference or detect system preference
const savedDarkMode = localStorage.getItem('darkMode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
	document.body.classList.add('dark');
	document.getElementById('darkModeToggle').checked = true;
	document.getElementById('sunIcon').style.display = 'none';
	document.getElementById('moonIcon').style.display = 'block';
} else {
	document.getElementById('sunIcon').style.display = 'block';
	document.getElementById('moonIcon').style.display = 'none';
}

function formatCurrency(amount) {
	return amount.toLocaleString('id-ID', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
}

function showToast(message, type = 'success') {
	const toast = document.getElementById('toast');
	const toastMessage = document.getElementById('toastMessage');
	toastMessage.textContent = message;
	toast.className = `toast ${type} show`;

	setTimeout(() => {
		toast.classList.remove('show');
	}, 5000);
}

function clearForm() {
	document.getElementById('invoiceForm').reset();
	document.getElementById('supplierSelected').value = '';
}

// Load suppliers from backend
async function loadSuppliers() {
	console.log('=== LOAD SUPPLIERS STARTED ===');
	try {
		console.log('Starting to load suppliers...');
		const response = await fetch(`${API_BASE_URL}/api/supplierList`);
		if (response.ok) {
			supplierOptions = await response.json();
			console.log('Suppliers loaded:', supplierOptions);
			console.log('Type of supplierOptions:', typeof supplierOptions);
			console.log('Is array:', Array.isArray(supplierOptions));
			
			// Wait for DOM to be fully loaded
			if (document.readyState === 'loading') {
				console.log('DOM still loading, waiting for DOMContentLoaded...');
				document.addEventListener('DOMContentLoaded', () => {
					console.log('DOMContentLoaded fired, initializing supplier search...');
					initializeSupplierSearch();
				});
			} else {
				console.log('DOM already loaded, initializing supplier search immediately...');
				initializeSupplierSearch();
			}
		} else {
			console.error('Failed to load suppliers, status:', response.status);
		}
	} catch (error) {
		console.error('Error loading suppliers:', error);
	}
	console.log('=== LOAD SUPPLIERS COMPLETED ===');
}

function initializeSupplierSearch() {
	console.log('Initializing supplier search...');
	
	const searchInput = document.getElementById('supplierSearch');
	const dropdown = document.getElementById('supplierDropdown');
	const hiddenInput = document.getElementById('supplierSelected');
	
	console.log('Search input element:', searchInput);
	console.log('Dropdown element:', dropdown);
	console.log('Hidden input element:', hiddenInput);
	
	if (!searchInput) {
		console.error('CRITICAL: supplierSearch input not found!');
		return;
	}
	
	if (!dropdown) {
		console.error('CRITICAL: supplierDropdown not found!');
		return;
	}
	
	if (!hiddenInput) {
		console.error('CRITICAL: supplierSelected hidden input not found!');
		return;
	}
	
	console.log('All supplier search elements found successfully');
	console.log('Supplier search initialized successfully');
	
	// Populate dropdown with all suppliers initially
	populateDropdown('');
	
	// Handle input changes
	searchInput.addEventListener('input', function() {
		const searchTerm = this.value.toLowerCase().trim();
		populateDropdown(searchTerm);
		showDropdown();
	});
	
	// Handle focus
	searchInput.addEventListener('focus', function() {
		populateDropdown(this.value.toLowerCase().trim());
		showDropdown();
	});
	
	// Handle clicks outside to close dropdown
	document.addEventListener('click', function(e) {
		if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
			hideDropdown();
		}
	});
	
	// Handle keyboard navigation
	let highlightedIndex = -1;
	
	searchInput.addEventListener('keydown', function(e) {
		const options = dropdown.querySelectorAll('.supplier-option');
		
		switch(e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
				updateHighlight(options);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				updateHighlight(options);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && options[highlightedIndex]) {
					selectSupplier(options[highlightedIndex]);
				}
				break;
			case 'Escape':
				hideDropdown();
				break;
		}
	});
	
	function populateDropdown(searchTerm) {
		dropdown.innerHTML = '';
		
		const filteredSuppliers = supplierOptions.filter(supplier => {
			const name = (supplier.name || supplier).toLowerCase();
			return name.includes(searchTerm);
		});
		
		if (filteredSuppliers.length === 0) {
			const noResult = document.createElement('div');
			noResult.className = 'supplier-option';
			noResult.textContent = 'Tidak ada supplier ditemukan';
			noResult.style.color = '#999';
			noResult.style.cursor = 'default';
			dropdown.appendChild(noResult);
			return;
		}
		
		filteredSuppliers.forEach((supplier, index) => {
			const option = document.createElement('div');
			option.className = 'supplier-option';
			option.textContent = supplier.name || supplier;
			option.dataset.index = index;
			
			option.addEventListener('click', function() {
				selectSupplier(this);
			});
			
			dropdown.appendChild(option);
		});
	}
	
	function selectSupplier(optionElement) {
		const supplierName = optionElement.textContent;
		searchInput.value = supplierName;
		hiddenInput.value = supplierName;
		hideDropdown();
		highlightedIndex = -1;
		console.log('Supplier selected:', supplierName);
	}
	
	function showDropdown() {
		dropdown.classList.add('show');
	}
	
	function hideDropdown() {
		dropdown.classList.remove('show');
		highlightedIndex = -1;
	}
	
	function updateHighlight(options) {
		// Remove previous highlight
		options.forEach(option => option.classList.remove('highlighted'));
		
		// Add new highlight
		if (highlightedIndex >= 0 && options[highlightedIndex]) {
			options[highlightedIndex].classList.add('highlighted');
			options[highlightedIndex].scrollIntoView({ block: 'nearest' });
		}
	}
}

// Load suppliers on page load
loadSuppliers();
