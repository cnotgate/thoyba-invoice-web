export interface User {
	id: number;
	username: string;
	role: 'admin' | 'user';
	created_at?: string;
}

export interface Supplier {
	id: number;
	name: string;
	createdAt?: string;
}

export interface Invoice {
	id: number;
	supplier: string;
	branch: 'Kuripan' | 'Cempaka' | 'Gatot';
	date: string;
	invoiceNumber: string;
	total: string;
	description?: string;
	timestamp?: string;
	paid: boolean;
	paidDate?: string;
}

export interface InvoiceFormData {
	supplier: string;
	branch: 'Kuripan' | 'Cempaka' | 'Gatot';
	date: string;
	invoiceNumber: string;
	total: string;
	description?: string;
}

export interface AuthResponse {
	success: boolean;
	token?: string;
	username?: string;
	role?: string;
	user?: User;
	message?: string;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	message?: string;
	data?: T;
}
