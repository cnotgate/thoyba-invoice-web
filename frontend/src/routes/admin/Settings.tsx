import { createSignal, Show } from 'solid-js';
import { BsPersonCircle, BsShieldCheck, BsGearFill, BsExclamationTriangle } from 'solid-icons/bs';
import { api } from '../../services/api';
import { useAuth } from '../../stores/authStore';
import Toast from '../../components/Toast';

export default function Settings() {
	const { authState } = useAuth();
	const [loading, setLoading] = createSignal(false);
	const [showChangePassword, setShowChangePassword] = createSignal(false);
	const [showLogoutModal, setShowLogoutModal] = createSignal(false);

	// Toast
	const [showToast, setShowToast] = createSignal(false);
	const [toastMessage, setToastMessage] = createSignal('');
	const [toastType, setToastType] = createSignal<'success' | 'error' | 'info'>('success');

	function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
		setToastMessage(message);
		setToastType(type);
		setShowToast(true);
	}

	// Get user info from authStore
	const username = () => authState.user?.username || 'Unknown';
	const role = () => authState.user?.role || 'user';

	// Password change form
	const [passwordForm, setPasswordForm] = createSignal({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	// Theme preference
	const [theme, setTheme] = createSignal<'light' | 'dark' | 'system'>('system');

	async function handleChangePassword(e: Event) {
		e.preventDefault();
		const form = passwordForm();

		// Validation
		if (!form.currentPassword) {
			triggerToast('Password saat ini harus diisi!', 'error');
			return;
		}

		if (!form.newPassword) {
			triggerToast('Password baru harus diisi!', 'error');
			return;
		}

		if (form.newPassword !== form.confirmPassword) {
			triggerToast('Password baru tidak cocok!', 'error');
			return;
		}

		if (form.newPassword.length < 6) {
			triggerToast('Password minimal 6 karakter!', 'error');
			return;
		}

		if (form.currentPassword === form.newPassword) {
			triggerToast('Password baru harus berbeda dengan password lama!', 'error');
			return;
		}

		setLoading(true);
		try {
			await api.changePassword({
				currentPassword: form.currentPassword,
				newPassword: form.newPassword,
			});

			triggerToast('Password berhasil diubah!', 'success');
			setShowChangePassword(false);
			setPasswordForm({
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Gagal mengganti password!';
			triggerToast(errorMessage, 'error');
		} finally {
			setLoading(false);
		}
	}

	function handleThemeChange(newTheme: 'light' | 'dark' | 'system') {
		setTheme(newTheme);
		// Apply theme
		if (newTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (newTheme === 'light') {
			document.documentElement.classList.remove('dark');
		} else {
			// System preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
		localStorage.setItem('theme', newTheme);
	}

	function handleLogoutClick() {
		setShowLogoutModal(true);
	}

	function handleLogoutConfirm() {
		// Clear all auth data
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		localStorage.removeItem('role');
		localStorage.removeItem('createdAt');

		// Force reload to login page
		window.location.href = '/login';
	}

	function formatDate(isoString: string) {
		const date = new Date(isoString);
		return date.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	return (
		<div>
			<h1 class="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-800 dark:text-white">
				Pengaturan
			</h1>

			{/* Account Information */}
			<section class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
				<div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center gap-3 mb-4">
						<BsPersonCircle class="w-6 h-6 text-blue-600 dark:text-blue-400" />
						<h2 class="text-xl font-semibold text-gray-800 dark:text-white">
							Informasi Akun
						</h2>
					</div>
				</div>
				<div class="p-4 md:p-6 space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
							Username:
						</span>
						<span class="text-base font-semibold text-gray-800 dark:text-white">
							{username()}
						</span>
					</div>
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
							Role:
						</span>
						<span 
							class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium w-fit ${
								role() === 'admin' 
									? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
									: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
							}`}
						>
							<BsShieldCheck class="w-4 h-4" />
							{role() === 'admin' ? 'Administrator' : 'User'}
						</span>
					</div>
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
							Terdaftar:
						</span>
						<span class="text-base text-gray-700 dark:text-gray-300">
							{authState.user?.created_at ? formatDate(authState.user.created_at) : '-'}
						</span>
					</div>
					<div class="pt-4 border-t border-gray-200 dark:border-gray-700">
						<button
							onClick={() => setShowChangePassword(!showChangePassword())}
							class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
						>
							{showChangePassword() ? 'Batal Ganti Password' : 'Ganti Password'}
						</button>
					</div>

					{/* Change Password Form */}
					<Show when={showChangePassword()}>
						<form onSubmit={handleChangePassword} class="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Password Lama
								</label>
								<input
									type="password"
									required
									value={passwordForm().currentPassword}
									onInput={(e) => setPasswordForm({ ...passwordForm(), currentPassword: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Masukkan password lama"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Password Baru
								</label>
								<input
									type="password"
									required
									minLength={6}
									value={passwordForm().newPassword}
									onInput={(e) => setPasswordForm({ ...passwordForm(), newPassword: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Minimal 6 karakter"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Konfirmasi Password Baru
								</label>
								<input
									type="password"
									required
									minLength={6}
									value={passwordForm().confirmPassword}
									onInput={(e) => setPasswordForm({ ...passwordForm(), confirmPassword: e.currentTarget.value })}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="Ulangi password baru"
								/>
							</div>
							<button
								type="submit"
								disabled={loading()}
								class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
							>
								{loading() ? 'Menyimpan...' : 'Simpan Password Baru'}
							</button>
						</form>
					</Show>
				</div>
			</section>

			{/* App Settings */}
			<section class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
				<div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
					<div class="flex items-center gap-3 mb-4">
						<BsGearFill class="w-6 h-6 text-blue-600 dark:text-blue-400" />
						<h2 class="text-xl font-semibold text-gray-800 dark:text-white">
							Pengaturan Aplikasi
						</h2>
					</div>
				</div>
				<div class="p-4 md:p-6 space-y-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Tema Tampilan
						</label>
						<div class="flex flex-col sm:flex-row gap-3">
							<button
								onClick={() => handleThemeChange('light')}
								class={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${theme() === 'light'
									? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
									: 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
									}`}
							>
								<div class="text-sm font-medium">☀️ Terang</div>
							</button>
							<button
								onClick={() => handleThemeChange('dark')}
								class={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${theme() === 'dark'
									? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
									: 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
									}`}
							>
								<div class="text-sm font-medium">🌙 Gelap</div>
							</button>
							<button
								onClick={() => handleThemeChange('system')}
								class={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${theme() === 'system'
									? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
									: 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
									}`}
							>
								<div class="text-sm font-medium">💻 Sistem</div>
							</button>
						</div>
					</div>
				</div>
			</section>

			{/* Danger Zone */}
			<section class="bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-red-200 dark:border-red-900">
				<div class="p-4 md:p-6 border-b border-red-200 dark:border-red-900">
					<div class="flex items-center gap-3 mb-4">
						<BsExclamationTriangle class="w-6 h-6 text-red-600 dark:text-red-400" />
						<h2 class="text-xl font-semibold text-red-700 dark:text-red-400">
							Zona Berbahaya
						</h2>
					</div>
				</div>
				<div class="p-4 md:p-6 space-y-4">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h3 class="font-medium text-gray-800 dark:text-white mb-1">
								Keluar dari Akun
							</h3>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Anda akan diarahkan kembali ke halaman login
							</p>
						</div>
						<button
							onClick={handleLogoutClick}
							class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
						>
							Keluar
						</button>
					</div>
				</div>
			</section>

			{/* Logout Confirmation Modal */}
			<Show when={showLogoutModal()}>
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
						<div class="p-6">
							<div class="flex items-center gap-3 mb-4">
								<div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
									<BsExclamationTriangle class="w-6 h-6 text-red-600 dark:text-red-400" />
								</div>
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
									Konfirmasi Keluar
								</h3>
							</div>
							<p class="text-gray-600 dark:text-gray-400 mb-6">
								Apakah Anda yakin ingin keluar dari aplikasi? Anda harus login kembali untuk mengakses sistem.
							</p>
							<div class="flex gap-3">
								<button
									type="button"
									onClick={() => setShowLogoutModal(false)}
									class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Batal
								</button>
								<button
									type="button"
									onClick={handleLogoutConfirm}
									class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
								>
									Ya, Keluar
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
