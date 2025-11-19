import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { BsPersonCircle, BsShieldCheck, BsGearFill, BsExclamationTriangle } from 'solid-icons/bs';

export default function Settings() {
	const navigate = useNavigate();
	const [loading, setLoading] = createSignal(false);
	const [showChangePassword, setShowChangePassword] = createSignal(false);

	// Get user info from localStorage
	const username = localStorage.getItem('username') || 'Unknown';
	const role = localStorage.getItem('role') || 'user';
	const createdAt = localStorage.getItem('createdAt') || new Date().toISOString();

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

		if (form.newPassword !== form.confirmPassword) {
			alert('Password baru tidak cocok!');
			return;
		}

		if (form.newPassword.length < 6) {
			alert('Password minimal 6 karakter!');
			return;
		}

		setLoading(true);
		try {
			// TODO: Implement change password API
			alert('Fitur ganti password akan segera tersedia!');
			setShowChangePassword(false);
			setPasswordForm({
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			});
		} catch (error) {
			alert('Gagal mengganti password!');
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

	function handleLogout() {
		if (confirm('Yakin ingin keluar?')) {
			localStorage.removeItem('token');
			localStorage.removeItem('username');
			localStorage.removeItem('role');
			localStorage.removeItem('createdAt');
			navigate('/login');
		}
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
							{username}
						</span>
					</div>
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
							Role:
						</span>
						<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
							<BsShieldCheck class="w-4 h-4" />
							{role === 'admin' ? 'Administrator' : 'User'}
						</span>
					</div>
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
							Terdaftar:
						</span>
						<span class="text-base text-gray-700 dark:text-gray-300">
							{formatDate(createdAt)}
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
							onClick={handleLogout}
							class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
						>
							Keluar
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
