import { Component, createSignal, createResource, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import Navbar from '../components/Navbar';
import SupplierDropdown from '../components/SupplierDropdown';
import Toast from '../components/Toast';
import { api } from '../services/api';
import type { InvoiceFormData } from '../types';

const Home: Component = () => {
	const navigate = useNavigate();
	const [suppliers] = createResource(api.getSuppliers);
	const [formData, setFormData] = createSignal<InvoiceFormData>({
		supplier: '',
		branch: 'Kuripan',
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
		setIsSubmitting(true);

		try {
			const result = await api.createInvoice(formData());

			if (result.success) {
				setToastType('success');
				setToastMessage('Invoice berhasil disimpan!');
				setShowToast(true);

				// Reset form
				setFormData({
					supplier: '',
					branch: 'Kuripan',
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
										value="Kuripan"
										checked={formData().branch === 'Kuripan'}
										onChange={() => setFormData({ ...formData(), branch: 'Kuripan' })}
										required
										class="mr-2"
									/>
									Kuripan
								</label>
								<label class="flex items-center">
									<input
										type="radio"
										name="branch"
										value="Cempaka"
										checked={formData().branch === 'Cempaka'}
										onChange={() => setFormData({ ...formData(), branch: 'Cempaka' })}
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
								type="number"
								id="total"
								value={formData().total}
								onInput={(e) => setFormData({ ...formData(), total: e.currentTarget.value })}
								required
								class="input"
								placeholder="Contoh: 6000000"
							/>
						</div>

						<div>
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
