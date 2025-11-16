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
	const supplier = document.getElementById('supplier').value.trim();
	const supplierSearch = document.getElementById('supplierSearch').value.trim();
	const branch = document.querySelector('input[name="branch"]:checked');
	const date = document.getElementById('date').value;
	const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
	const total = document.getElementById('total').value.replace(/\./g, ''); // Remove formatting dots

	if (!supplierSearch || !branch || !date || !invoiceNumber || !total) {
		showToast('Harap isi semua field yang wajib.', 'error');
		submitBtn.disabled = false;
		submitBtn.textContent = 'Simpan';
		return;
	}

	// Validate supplier is in the list
	const validSuppliers = supplierOptions.map(s => s.name || s);
	if (!validSuppliers.includes(supplierSearch)) {
		showToast('Supplier tidak valid. Pilih dari daftar yang muncul saat mengetik.', 'error');
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
		supplier: supplierSearch,
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
}

// Load suppliers from backend
async function loadSuppliers() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/supplierList`);
		if (response.ok) {
			supplierOptions = await response.json();
			console.log('Suppliers loaded:', supplierOptions);
			console.log('Type of supplierOptions:', typeof supplierOptions);
			console.log('Is array:', Array.isArray(supplierOptions));
			
			// Populate the select dropdown with supplier options
			const select = document.getElementById('supplier');
			if (!select) {
				console.error('Supplier select not found');
				return;
			}
			console.log('Select element:', select);
			// Clear existing options except the first one
			select.innerHTML = '<option value="">Pilih supplier...</option>';
			supplierOptions.forEach((supplier) => {
				const option = document.createElement('option');
				option.value = supplier.name || supplier;
				option.textContent = supplier.name || supplier;
				select.appendChild(option);
			});
			console.log('Select populated with', supplierOptions.length, 'suppliers');
			
			// Initialize search functionality
			initializeSupplierSearch();
		} else {
			console.error('Failed to load suppliers');
		}
	} catch (error) {
		console.error('Error loading suppliers:', error);
	}
}

function initializeSupplierSearch() {
	const searchInput = document.getElementById('supplierSearch');
	const select = document.getElementById('supplier');
	
	searchInput.addEventListener('input', function() {
		const searchTerm = this.value.toLowerCase().trim();
		const options = select.querySelectorAll('option');
		
		if (searchTerm === '') {
			// Show all options when search is empty
			select.style.display = 'none';
			options.forEach(option => {
				option.style.display = 'block';
			});
			return;
		}
		
		let hasVisibleOptions = false;
		options.forEach(option => {
			if (option.value === '') return; // Skip placeholder option
			
			const text = option.textContent.toLowerCase();
			if (text.includes(searchTerm)) {
				option.style.display = 'block';
				hasVisibleOptions = true;
			} else {
				option.style.display = 'none';
			}
		});
		
		// Show select if there are matching options
		select.style.display = hasVisibleOptions ? 'block' : 'none';
	});
	
	searchInput.addEventListener('focus', function() {
		if (this.value.trim() !== '') {
			select.style.display = 'block';
		}
	});
	
	searchInput.addEventListener('blur', function() {
		// Hide select after a short delay to allow clicking on options
		setTimeout(() => {
			select.style.display = 'none';
		}, 200);
	});
	
	select.addEventListener('change', function() {
		if (this.value) {
			searchInput.value = this.options[this.selectedIndex].text;
			select.style.display = 'none';
		}
	});
}// Load suppliers on page load
loadSuppliers();
