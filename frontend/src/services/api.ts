import type { Invoice, InvoiceFormData } from '../types';

const API_BASE = '/api';

function getAuthHeaders() {
	const token = localStorage.getItem('token');
	return {
		'Content-Type': 'application/json',
		...(token && { Authorization: `Bearer ${token}` }),
	};
}

export const api = {
	// Suppliers
	async getSuppliers(): Promise<string[]> {
		const response = await fetch(`${API_BASE}/suppliers/list`);
		return response.json();
	},

	async getAllSuppliersWithDetails(): Promise<Array<{ id: number; name: string }>> {
		const response = await fetch(`${API_BASE}/suppliers`, {
			headers: getAuthHeaders(),
		});
		return response.json();
	},

	async createSupplier(name: string): Promise<{ success: boolean; supplier?: any }> {
		const response = await fetch(`${API_BASE}/suppliers`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify({ name }),
		});
		return response.json();
	},

	async updateSupplier(id: number, name: string): Promise<{ success: boolean; supplier?: any }> {
		const response = await fetch(`${API_BASE}/suppliers/${id}`, {
			method: 'PATCH',
			headers: getAuthHeaders(),
			body: JSON.stringify({ name }),
		});
		return response.json();
	},

	async deleteSupplier(id: number): Promise<{ success: boolean }> {
		const response = await fetch(`${API_BASE}/suppliers/${id}`, {
			method: 'DELETE',
			headers: getAuthHeaders(),
		});
		return response.json();
	},

	// Invoices
	async createInvoice(data: InvoiceFormData): Promise<{ success: boolean; invoice?: Invoice }> {
		const response = await fetch(`${API_BASE}/invoices`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		return response.json();
	},

	async getInvoices(): Promise<Invoice[]> {
		const response = await fetch(`${API_BASE}/invoices`, {
			headers: getAuthHeaders(),
		});
		return response.json();
	},

	async updateInvoice(id: number, data: Partial<Invoice>): Promise<{ success: boolean }> {
		const response = await fetch(`${API_BASE}/invoices/${id}`, {
			method: 'PATCH',
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});
		return response.json();
	},

	async deleteInvoice(id: number): Promise<{ success: boolean }> {
		const response = await fetch(`${API_BASE}/invoices/${id}`, {
			method: 'DELETE',
			headers: getAuthHeaders(),
		});
		return response.json();
	},

	// Users
	async getUsers(): Promise<Array<{ id: number; username: string; role: string; createdAt: string }>> {
		const response = await fetch(`${API_BASE}/users`, {
			headers: getAuthHeaders(),
		});
		return response.json();
	},

	async createUser(data: {
		username: string;
		password: string;
		role: string;
	}): Promise<{ success: boolean; user?: any }> {
		const response = await fetch(`${API_BASE}/users`, {
			method: 'POST',
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});
		const result = await response.json();
		if (!response.ok) {
			throw new Error(result.message || 'Failed to create user');
		}
		return result;
	},

	async deleteUser(id: number): Promise<{ success: boolean }> {
		const response = await fetch(`${API_BASE}/users/${id}`, {
			method: 'DELETE',
			headers: getAuthHeaders(),
		});
		return response.json();
	},

	// Auth
	async login(username: string, password: string) {
		const response = await fetch(`${API_BASE}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});
		return response.json();
	},
};

// Export individual functions for convenience
export const getSuppliers = api.getSuppliers;
export const getAllSuppliersWithDetails = api.getAllSuppliersWithDetails;
export const createSupplier = api.createSupplier;
export const updateSupplier = api.updateSupplier;
export const deleteSupplier = api.deleteSupplier;
export const createInvoice = api.createInvoice;
export const getInvoices = api.getInvoices;
export const updateInvoice = api.updateInvoice;
export const deleteInvoice = api.deleteInvoice;
export const getUsers = api.getUsers;
export const createUser = api.createUser;
export const deleteUser = api.deleteUser;
export const login = api.login;
