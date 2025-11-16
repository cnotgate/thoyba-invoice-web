// Configuration
const API_BASE_URL = window.location.origin.includes('localhost')
	? 'http://localhost:3001'
	: window.location.origin;

document.getElementById('invoiceForm').addEventListener('submit', function (event) {
	console.log('Form submit prevented');

	// Disable submit button to prevent double submission
	const submitBtn = document.getElementById('submitBtn');
	submitBtn.disabled = true;
	submitBtn.textContent = 'Menyimpan...';

	// Basic validation
	const supplier = document.getElementById('supplier').value.trim();
	const branch = document.querySelector('input[name="branch"]:checked');
	const date = document.getElementById('date').value;
	const invoiceNumber = document.getElementById('invoiceNumber').value.trim();
	const total = document.getElementById('total').value.replace(/\./g, ''); // Remove formatting dots

	if (!supplier || !branch || !date || !invoiceNumber || !total) {
		showToast('Harap isi semua field yang wajib.', 'error');
		submitBtn.disabled = false;
		submitBtn.textContent = 'Simpan';
		return;
	}

	// Validate supplier is in the list
	let supplierOptions = [];
	if (!supplierOptions.includes(supplier)) {
		showToast('Supplier tidak valid. Pilih dari daftar yang tersedia.', 'error');
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
		supplier: supplier,
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
		} else {
			console.error('Failed to load suppliers');
		}
	} catch (error) {
		console.error('Error loading suppliers:', error);
	}
}

// Load suppliers on page load
loadSuppliers();
