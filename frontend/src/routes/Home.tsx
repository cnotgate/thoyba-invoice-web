import { Component, createSignal, createResource, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import Navbar from '../components/Navbar';
import SupplierDropdown from '../components/SupplierDropdown';
import Toast from '../components/Toast';
import { api } from '../services/api';
import type { InvoiceFormData } from '../types';
import { formatWithThousandsSeparator, toDecimalString } from '../utils/currency';

const Home: Component = () => {
	const navigate = useNavigate();
	const [suppliers] = createResource(api.getSuppliers);
	const [formData, setFormData] = createSignal<InvoiceFormData>({
		supplier: '',
		branch: 'Cempaka',
		date: '',
		invoiceNumber: '',
		total: '',
		description: '',
	});
	const [isSubmitting, setIsSubmitting] = createSignal(false);
	const [showToast, setShowToast] = createSignal(false);
	const [toastMessage, setToastMessage] = createSignal('');
	const [toastType, setToastType] = createSignal<'success' | 'error'>('success');

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		// Frontend validation
		const data = formData();
		const errors: string[] = [];

		if (!data.supplier.trim()) errors.push('Supplier harus diisi');
		if (!data.date) errors.push('Tanggal harus diisi');
		if (!data.invoiceNumber.trim()) errors.push('Nomor invoice harus diisi');
		if (!data.total.trim()) errors.push('Total harus diisi');

		if (data.supplier.length > 200) errors.push('Supplier maksimal 200 karakter');
		if (data.invoiceNumber.length > 100) errors.push('Nomor invoice maksimal 100 karakter');
		if (data.description && data.description.length > 500) errors.push('Keterangan maksimal 500 karakter');

		// Validate total format
		if (data.total && !/^\d+(\.\d{1,2})?$/.test(data.total.replace(/[.,\s]/g, '').replace(',', '.'))) {
			errors.push('Format total tidak valid');
		}

		if (errors.length > 0) {
			setToastType('error');
			setToastMessage('Validation Error: ' + errors.join(', '));
			setShowToast(true);
			return;
		}

		setIsSubmitting(true);

		try {
			// Convert total to decimal string before submitting
			const submitData = {
				...formData(),
				total: toDecimalString(formData().total)
			};

			const result = await api.createInvoice(submitData);

			if (result.success) {
				setToastType('success');
				setToastMessage('Invoice berhasil disimpan!');
				setShowToast(true);

				// Reset form
				setFormData({
					supplier: '',
					branch: 'Cempaka',
					date: '',
					invoiceNumber: '',
					total: '',
					description: '',
				});
			} else {
				throw new Error('Failed to create invoice');
			}
		} catch (error) {
			setToastType('error');
			setToastMessage('Gagal menyimpan invoice');
			setShowToast(true);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Navbar />

			<div class="max-w-3xl mx-auto px-4 py-8">
				<div class="card">
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-2xl font-bold">Invoice Baru</h2>
						<button
							onClick={() => navigate('/login')}
							class="btn btn-secondary text-sm"
						>
							Admin Login
						</button>
					</div>

					<form onSubmit={handleSubmit} class="space-y-6">
						<SupplierDropdown
							suppliers={suppliers()}
							value={formData().supplier}
							onChange={(value) => setFormData({ ...formData(), supplier: value })}
							required
						/>

						<div>
							<label class="label">Cabang *</label>
							<div class="flex gap-4">
								<label class="flex items-center">
									<input
										type="radio"
										name="branch"
										value="Cempaka"
										checked={formData().branch === 'Cempaka'}
										onChange={() => setFormData({ ...formData(), branch: 'Cempaka' })}
										required
										class="mr-2"
									/>
									Cempaka
								</label>
								<label class="flex items-center">
									<input
										type="radio"
										name="branch"
										value="Gatot"
										checked={formData().branch === 'Gatot'}
										onChange={() => setFormData({ ...formData(), branch: 'Gatot' })}
										class="mr-2"
									/>
									Gatot
								</label>
							</div>
						</div>

						<div>
							<label class="label" for="date">Tanggal Nota *</label>
							<input
								type="date"
								id="date"
								value={formData().date}
								onInput={(e) => setFormData({ ...formData(), date: e.currentTarget.value })}
								required
								class="input"
							/>
						</div>

						<div>
							<label class="label" for="invoiceNumber">Nomor Faktur *</label>
							<input
								type="text"
								id="invoiceNumber"
								value={formData().invoiceNumber}
								onInput={(e) => setFormData({ ...formData(), invoiceNumber: e.currentTarget.value })}
								required
								class="input"
								placeholder="Contoh: INV-2025-001"
							/>
						</div>

						<div>
							<label class="label" for="total">Total (Rp) *</label>
							<input
								type="text"
								inputmode="numeric"
								id="total"
								value={formData().total}
								onInput={(e) => {
									// Allow only digits during typing
									const value = e.currentTarget.value.replace(/\D/g, '');
									setFormData({ ...formData(), total: value });
								}}
								onFocus={(e) => {
									// Remove formatting when focused
									const value = e.currentTarget.value.replace(/\D/g, '');
									setFormData({ ...formData(), total: value });
								}}
								onBlur={(e) => {
									// Format with thousands separator on blur
									const value = e.currentTarget.value.replace(/\D/g, '');
									if (value) {
										setFormData({ ...formData(), total: formatWithThousandsSeparator(value) });
									}
								}}
								required
								class="input"
								placeholder="Contoh: 6000000"
							/>
						</div>						<div>
							<label class="label" for="description">Keterangan</label>
							<textarea
								id="description"
								value={formData().description}
								onInput={(e) => setFormData({ ...formData(), description: e.currentTarget.value })}
								class="input"
								rows="3"
								placeholder="Opsional: Catatan tambahan"
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting()}
							class="btn btn-primary w-full"
						>
							{isSubmitting() ? 'Menyimpan...' : 'Simpan Invoice'}
						</button>
					</form>
				</div>
			</div>

			<Show when={showToast()}>
				<Toast
					message={toastMessage()}
					type={toastType()}
					onClose={() => setShowToast(false)}
				/>
			</Show>
		</div>
	);
};

export default Home;
