/**
 * Format number with thousands separator (Indonesian style)
 * Example: 1234567 -> "1.234.567"
 */
export function formatWithThousandsSeparator(value: string | number): string {
	// Convert to string and remove any non-digit characters
	const numStr = String(value).replace(/\D/g, '');

	// Return empty string if no digits
	if (!numStr) return '';

	// Add thousands separator (dots)
	return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Remove formatting and return plain number string
 * Example: "1.234.567" -> "1234567"
 */
export function parseFormattedCurrency(value: string): string {
	return value.replace(/\D/g, '');
}

/**
 * Convert formatted currency to decimal number string for database
 * Example: "1234567" -> "1234567.00"
 * Example: "123456789" -> "123456789.00"
 */
export function toDecimalString(value: string | number): string {
	const numStr = String(value).replace(/\D/g, '');
	if (!numStr) return '0.00';

	const num = parseFloat(numStr);
	return num.toFixed(2);
}

/**
 * Handle input change for formatted currency field
 * Prevents entry of dots and commas, formats with thousands separator
 */
export function handleCurrencyInput(e: InputEvent, currentValue: string, onChange: (value: string) => void): void {
	const input = e.currentTarget as HTMLInputElement;
	const newValue = input.value;

	// Get cursor position before formatting
	const cursorPos = input.selectionStart || 0;

	// Remove all non-digit characters
	const digitsOnly = newValue.replace(/\D/g, '');

	// Format with thousands separator
	const formatted = formatWithThousandsSeparator(digitsOnly);

	// Update value
	onChange(digitsOnly);

	// Calculate new cursor position
	// Count how many characters were before cursor (excluding dots)
	const digitsBefore = currentValue.slice(0, cursorPos).replace(/\D/g, '').length;

	// Find position of Nth digit in formatted string
	let newCursorPos = 0;
	let digitCount = 0;
	for (let i = 0; i < formatted.length; i++) {
		if (formatted[i] !== '.') {
			digitCount++;
			if (digitCount === digitsBefore) {
				newCursorPos = i + 1;
				break;
			}
		}
	}

	// If we're at the end, place cursor at end
	if (digitCount < digitsBefore || digitsBefore === 0) {
		newCursorPos = formatted.length;
	}

	// Restore cursor position after React updates
	requestAnimationFrame(() => {
		if (input) {
			input.setSelectionRange(newCursorPos, newCursorPos);
		}
	});
}

/**
 * Prevent entry of dots, commas, and other non-digit characters
 */
export function preventNonDigitInput(e: KeyboardEvent): void {
	const key = e.key;

	// Allow: backspace, delete, tab, escape, enter, arrow keys
	const allowedKeys = [
		'Backspace',
		'Delete',
		'Tab',
		'Escape',
		'Enter',
		'ArrowLeft',
		'ArrowRight',
		'ArrowUp',
		'ArrowDown',
		'Home',
		'End',
	];

	// Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
	if (e.ctrlKey || e.metaKey) {
		return;
	}

	// If it's an allowed key, let it through
	if (allowedKeys.includes(key)) {
		return;
	}

	// If it's not a digit, prevent it
	if (!/^\d$/.test(key)) {
		e.preventDefault();
	}
}
