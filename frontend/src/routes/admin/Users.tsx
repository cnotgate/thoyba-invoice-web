import { createSignal, createEffect, For, Show } from 'solid-js';
import { BsSearch, BsPersonPlus, BsTrash, BsShieldCheck, BsXCircle } from 'solid-icons/bs';
import * as api from '../../services/api';

interface User {
	id: number;
	username: string;
	role: string;
	createdAt: string;
}

export default function Users() {
	const [users, setUsers] = createSignal<User[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [searchQuery, setSearchQuery] = createSignal('');

	// Add user modal
	const [showAddModal, setShowAddModal] = createSignal(false);
	const [addForm, setAddForm] = createSignal({
		username: '',
		password: '',
		confirmPassword: '',
		role: 'user'
	});

	// Delete modal
	const [showDeleteModal, setShowDeleteModal] = createSignal(false);
	const [selectedUser, setSelectedUser] = createSignal<User | null>(null);

	// Load users
	async function loadUsers() {
		setLoading(true);
		try {
			const data = await api.getUsers();
			setUsers(data);
		} catch (error) {
			console.error('Failed to load users:', error);
			alert('Gagal memuat data users!');
		} finally {
			setLoading(false);
		}
	}

	createEffect(() => {
		loadUsers();
	});

	// Filtered users based on search
	const filteredUsers = () => {
		const query = searchQuery().toLowerCase();
		if (!query) return users();

		return users().filter(user =>
			user.username.toLowerCase().includes(query) ||
			user.role.toLowerCase().includes(query)
		);
	};

	// Add user
	async function handleAddUser(e: Event) {
		e.preventDefault();
		const form = addForm();

		if (form.password !== form.confirmPassword) {
			alert('Password tidak cocok!');
			return;
		}

		if (form.password.length < 6) {
			alert('Password minimal 6 karakter!');
			return;
		}

		try {
			await api.createUser({
				username: form.username,
				password: form.password,
				role: form.role
			});

			alert('User berhasil ditambahkan!');
			setShowAddModal(false);
			setAddForm({
				username: '',
				password: '',
				confirmPassword: '',
				role: 'user'
			});
			loadUsers();
		} catch (error: any) {
			alert(error.message || 'Gagal menambahkan user!');
		}
	}

	// Delete user
	async function handleDeleteUser() {
		const user = selectedUser();
		if (!user) return;

		try {
			await api.deleteUser(user.id);
			alert('User berhasil dihapus!');
			setShowDeleteModal(false);
			setSelectedUser(null);
			loadUsers();
		} catch (error) {
			alert('Gagal menghapus user!');
		}
	}

	function openDeleteModal(user: User) {
		setSelectedUser(user);
		setShowDeleteModal(true);
	}

	function formatDate(isoString: string) {
		const date = new Date(isoString);
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	return (
		<div>
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
					Manajemen Pengguna
				</h1>
				<div class="flex justify-end">
					<button
						onClick={() => setShowAddModal(true)}
						class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
					>
						<BsPersonPlus class="w-4 h-4 flex-shrink-0" />
						<span>Tambah User</span>
					</button>
				</div>
			</div>

			{/* Search Bar */}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4 mb-6">
				<div class="relative">
					<BsSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Cari username atau role..."
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
					<p class="mt-4 text-gray-600 dark:text-gray-400">Memuat data users...</p>
				</div>
			</Show>

			{/* Empty State */}
			<Show when={!loading() && filteredUsers().length === 0}>
				<div class="text-center py-12">
					<p class="text-gray-600 dark:text-gray-400">
						{searchQuery() ? 'Tidak ada user yang ditemukan' : 'Belum ada user'}
					</p>
				</div>
			</Show>

			{/* Desktop Table */}
			<Show when={!loading() && filteredUsers().length > 0}>
				<div class="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Username
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Role
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Terdaftar
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
										Aksi
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
								<For each={filteredUsers()}>
									{(user) => (
										<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="text-sm font-medium text-gray-900 dark:text-white">
													{user.username}
												</div>
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<span class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
														? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
														: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
													}`}>
													<BsShieldCheck class="w-3.5 h-3.5" />
													{user.role === 'admin' ? 'Administrator' : 'User'}
												</span>
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
												{formatDate(user.createdAt)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<button
													onClick={() => openDeleteModal(user)}
													class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
												>
													<BsTrash class="w-3.5 h-3.5" />
													Hapus
												</button>
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</div>

				{/* Mobile Cards */}
				<div class="md:hidden space-y-4">
					<For each={filteredUsers()}>
						{(user) => (
							<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1 min-w-0">
										<p class="font-semibold text-gray-900 dark:text-white truncate">
											{user.username}
										</p>
										<span class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${user.role === 'admin'
												? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
												: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
											}`}>
											<BsShieldCheck class="w-3.5 h-3.5" />
											{user.role === 'admin' ? 'Admin' : 'User'}
										</span>
									</div>
								</div>

								<div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
									<span class="font-medium">Terdaftar:</span> {formatDate(user.createdAt)}
								</div>

								<button
									onClick={() => openDeleteModal(user)}
									class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
								>
									<BsTrash class="w-4 h-4" />
									Hapus User
								</button>
							</div>
						)}
					</For>
				</div>
			</Show>

			{/* Add User Modal */}
			<Show when={showAddModal()}>
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
						<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
								Tambah User Baru
							</h3>
							<button
								onClick={() => setShowAddModal(false)}
								class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								<BsXCircle class="w-6 h-6" />
							</button>
						</div>
						<form onSubmit={handleAddUser} class="p-4 space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Username
								</label>
								<input
									type="text"
									required
									minLength={3}
									value={addForm().username}
									onInput={(e) => setAddForm({ ...addForm(), username: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Masukkan username"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Password
								</label>
								<input
									type="password"
									required
									minLength={6}
									value={addForm().password}
									onInput={(e) => setAddForm({ ...addForm(), password: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Minimal 6 karakter"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Konfirmasi Password
								</label>
								<input
									type="password"
									required
									minLength={6}
									value={addForm().confirmPassword}
									onInput={(e) => setAddForm({ ...addForm(), confirmPassword: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Ulangi password"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Role
								</label>
								<select
									value={addForm().role}
									onChange={(e) => setAddForm({ ...addForm(), role: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="user">User</option>
									<option value="admin">Administrator</option>
								</select>
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
									Tambah User
								</button>
							</div>
						</form>
					</div>
				</div>
			</Show>

			{/* Delete Confirmation Modal */}
			<Show when={showDeleteModal() && selectedUser()}>
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
						<div class="p-6">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Konfirmasi Hapus User
							</h3>
							<p class="text-gray-600 dark:text-gray-400 mb-2">
								Apakah Anda yakin ingin menghapus user ini?
							</p>
							<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
								<p class="text-sm font-medium text-red-900 dark:text-red-200">
									Username: {selectedUser()?.username}
								</p>
								<p class="text-sm text-red-700 dark:text-red-300 mt-1">
									Role: {selectedUser()?.role}
								</p>
							</div>
							<p class="text-sm text-red-600 dark:text-red-400 mb-6">
								⚠️ Tindakan ini tidak dapat dibatalkan!
							</p>
							<div class="flex gap-3">
								<button
									onClick={() => {
										setShowDeleteModal(false);
										setSelectedUser(null);
									}}
									class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Batal
								</button>
								<button
									onClick={handleDeleteUser}
									class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
								>
									Hapus
								</button>
							</div>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
