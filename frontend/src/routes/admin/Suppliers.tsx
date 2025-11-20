import { createSignal, createEffect, For, Show } from 'solid-js';
import { BsSearch, BsPlus, BsTrash, BsXCircle, BsPencil } from 'solid-icons/bs';
import * as api from '../../services/api';
import Toast from '../../components/Toast';

interface Supplier {
	id: number;
	name: string;
}

export default function Suppliers() {
	const [suppliers, setSuppliers] = createSignal<Supplier[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [searchQuery, setSearchQuery] = createSignal('');
	const [showToast, setShowToast] = createSignal(false);
	const [toastMessage, setToastMessage] = createSignal('');
	const [toastType, setToastType] = createSignal<'success' | 'error'>('success');

	// Toast helper
	function triggerToast(message: string, type: 'success' | 'error') {
		setToastMessage(message);
		setToastType(type);
		setShowToast(true);
	}

	// Add supplier modal
	const [showAddModal, setShowAddModal] = createSignal(false);
	const [supplierName, setSupplierName] = createSignal('');

	// Edit supplier modal
	const [showEditModal, setShowEditModal] = createSignal(false);
	const [editSupplierName, setEditSupplierName] = createSignal('');
	const [editingSupplier, setEditingSupplier] = createSignal<Supplier | null>(null);

	// Delete modal
	const [showDeleteModal, setShowDeleteModal] = createSignal(false);
	const [selectedSupplier, setSelectedSupplier] = createSignal<Supplier | null>(null);

	// Load suppliers
	async function loadSuppliers() {
		setLoading(true);
		try {
			const data = await api.getAllSuppliersWithDetails();
			setSuppliers(data);
		} catch (error) {
			console.error('Failed to load suppliers:', error);
			triggerToast('Gagal memuat data suppliers!', 'error');
		} finally {
			setLoading(false);
		}
	}

	createEffect(() => {
		loadSuppliers();
	});

	// Filtered suppliers based on search
	const filteredSuppliers = () => {
		const query = searchQuery().toLowerCase();
		if (!query) return suppliers();

		return suppliers().filter(supplier =>
			supplier.name.toLowerCase().includes(query)
		);
	};

	// Add supplier
	async function handleAddSupplier(e: Event) {
		e.preventDefault();
		const name = supplierName().trim();

		if (!name) {
			triggerToast('Nama supplier tidak boleh kosong!', 'error');
			return;
		}

		try {
			await api.createSupplier(name);
			triggerToast('Supplier berhasil ditambahkan!', 'success');
			setShowAddModal(false);
			setSupplierName('');
			loadSuppliers();
		} catch (error: any) {
			triggerToast(error.message || 'Gagal menambahkan supplier!', 'error');
		}
	}

	// Edit supplier
	function openEditModal(supplier: Supplier) {
		setEditingSupplier(supplier);
		setEditSupplierName(supplier.name);
		setShowEditModal(true);
	}

	async function handleEditSupplier(e: Event) {
		e.preventDefault();
		const supplier = editingSupplier();
		if (!supplier) return;

		const name = editSupplierName().trim();
		if (!name) {
			triggerToast('Nama supplier tidak boleh kosong!', 'error');
			return;
		}

		try {
			await api.updateSupplier(supplier.id, name);
			triggerToast('Supplier berhasil diupdate!', 'success');
			setShowEditModal(false);
			setEditingSupplier(null);
			setEditSupplierName('');
			loadSuppliers();
		} catch (error: any) {
			triggerToast(error.message || 'Gagal mengupdate supplier!', 'error');
		}
	}

	// Delete supplier
	async function handleDeleteSupplier() {
		const supplier = selectedSupplier();
		if (!supplier) return;

		try {
			await api.deleteSupplier(supplier.id);
			triggerToast('Supplier berhasil dihapus!', 'success');
			setShowDeleteModal(false);
			setSelectedSupplier(null);
			loadSuppliers();
		} catch (error) {
			triggerToast('Gagal menghapus supplier!', 'error');
		}
	}

	function openDeleteModal(supplier: Supplier) {
		setSelectedSupplier(supplier);
		setShowDeleteModal(true);
	}

	return (
		<div>
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div>
					<h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
						Manajemen Suppliers
					</h1>
					<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
						Total: {filteredSuppliers().length} supplier{filteredSuppliers().length !== 1 ? 's' : ''}
					</p>
				</div>
				<div class="flex justify-end">
					<button
						onClick={() => setShowAddModal(true)}
						class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
					>
						<BsPlus class="w-5 h-5 flex-shrink-0" />
						<span>Tambah Supplier</span>
					</button>
				</div>
			</div>

			{/* Search Bar */}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-6">
				<div class="relative">
					<BsSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Cari nama supplier..."
						value={searchQuery()}
						onInput={(e) => setSearchQuery(e.currentTarget.value)}
						class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
					/>
				</div>
			</div>

			{/* Loading State */}
			<Show when={loading()}>
				<div class="text-center py-12">
					<div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
					<p class="mt-4 text-gray-600 dark:text-gray-400">Memuat data suppliers...</p>
				</div>
			</Show>

			{/* Empty State */}
			<Show when={!loading() && filteredSuppliers().length === 0}>
				<div class="text-center py-12">
					<p class="text-gray-600 dark:text-gray-400">
						{searchQuery() ? 'Tidak ada supplier yang ditemukan' : 'Belum ada supplier'}
					</p>
				</div>
			</Show>

			{/* Desktop Table */}
			<Show when={!loading() && filteredSuppliers().length > 0}>
				<div class="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
										ID
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Nama Supplier
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
										Aksi
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
								<For each={filteredSuppliers()}>
									{(supplier) => (
										<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm font-mono text-gray-600 dark:text-gray-400">
													#{supplier.id}
												</div>
											</td>
											<td class="px-6 py-4">
												<div class="text-sm font-medium text-gray-900 dark:text-white">
													{supplier.name}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="flex gap-2">
													<button
														onClick={() => openEditModal(supplier)}
														class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
													>
														<BsPencil class="w-3.5 h-3.5" />
														Edit
													</button>
													<button
														onClick={() => openDeleteModal(supplier)}
														class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
													>
														<BsTrash class="w-3.5 h-3.5" />
														Hapus
													</button>
												</div>
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</div>

				{/* Mobile Cards */}
				<div class="md:hidden space-y-3">
					<For each={filteredSuppliers()}>
						{(supplier) => (
							<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
								<div class="flex items-start justify-between gap-3 mb-3">
									<div class="flex-1 min-w-0">
										<p class="font-semibold text-gray-900 dark:text-white">
											{supplier.name}
										</p>
										<p class="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
											ID: #{supplier.id}
										</p>
									</div>
								</div>

								<div class="flex gap-2">
									<button
										onClick={() => openEditModal(supplier)}
										class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
									>
										<BsPencil class="w-4 h-4" />
										Edit
									</button>
									<button
										onClick={() => openDeleteModal(supplier)}
										class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
									>
										<BsTrash class="w-4 h-4" />
										Hapus
									</button>
								</div>
							</div>
						)}
					</For>
				</div>
			</Show>

			{/* Add Supplier Modal */}
			<Show when={showAddModal()}>
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
						<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
								Tambah Supplier Baru
							</h3>
							<button
								onClick={() => setShowAddModal(false)}
								class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								<BsXCircle class="w-6 h-6" />
							</button>
						</div>
						<form onSubmit={handleAddSupplier} class="p-4 space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Nama Supplier
								</label>
								<input
									type="text"
									required
									minLength={2}
									value={supplierName()}
									onInput={(e) => setSupplierName(e.currentTarget.value)}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Contoh: PT. Supplier Jaya"
									autofocus
								/>
							</div>
							<div class="flex gap-3 pt-4">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Batal
								</button>
								<button
									type="submit"
									class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
								>
									Tambah
								</button>
							</div>
						</form>
					</div>
				</div>
			</Show>

			{/* Edit Supplier Modal */}
			<Show when={showEditModal()}>
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
						<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
								Edit Supplier
							</h3>
							<button
								onClick={() => setShowEditModal(false)}
								class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								<BsXCircle class="w-6 h-6" />
							</button>
						</div>
						<form onSubmit={handleEditSupplier} class="p-4 space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Nama Supplier
								</label>
								<input
									type="text"
									required
									minLength={2}
									value={editSupplierName()}
									onInput={(e) => setEditSupplierName(e.currentTarget.value)}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Contoh: PT. Supplier Jaya"
									autofocus
								/>
							</div>
							<div class="flex gap-3 pt-4">
								<button
									type="button"
									onClick={() => setShowEditModal(false)}
									class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Batal
								</button>
								<button
									type="submit"
									class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
								>
									Simpan
								</button>
							</div>
						</form>
					</div>
				</div>
			</Show>

			{/* Delete Confirmation Modal */}
			<Show when={showDeleteModal() && selectedSupplier()}>
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Konfirmasi Hapus Supplier
							</h3>
							<p class="text-gray-600 dark:text-gray-400 mb-2">
								Apakah Anda yakin ingin menghapus supplier ini?
							</p>
							<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
								<p class="text-sm font-medium text-red-900 dark:text-red-200">
									{selectedSupplier()?.name}
								</p>
								<p class="text-sm text-red-700 dark:text-red-300 mt-1">
									ID: #{selectedSupplier()?.id}
								</p>
							</div>
							<p class="text-sm text-red-600 dark:text-red-400 mb-6">
								⚠️ Tindakan ini tidak dapat dibatalkan!
							</p>
							<div class="flex gap-3">
								<button
									onClick={() => {
										setShowDeleteModal(false);
										setSelectedSupplier(null);
									}}
									class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Batal
								</button>
								<button
									onClick={handleDeleteSupplier}
									class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
								>
									Hapus
								</button>
							</div>
						</div>
					</div>
				</div>
			</Show>

			{/* Toast Notification */}
			<Show when={showToast()}>
				<Toast
					message={toastMessage()}
					type={toastType()}
					onClose={() => setShowToast(false)}
				/>
			</Show>
		</div>
	);
}
