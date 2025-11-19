import { Component, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../stores/authStore';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const Login: Component = () => {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [username, setUsername] = createSignal('');
	const [password, setPassword] = createSignal('');
	const [isLoading, setIsLoading] = createSignal(false);
	const [showToast, setShowToast] = createSignal(false);
	const [toastMessage, setToastMessage] = createSignal('');

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await login(username(), password());

			if (result.success) {
				navigate('/admin');
			} else {
				setToastMessage(result.message || 'Login gagal');
				setShowToast(true);
			}
		} catch (error) {
			setToastMessage('Terjadi kesalahan saat login');
			setShowToast(true);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Navbar />

			<div class="max-w-md mx-auto px-4 py-16">
				<div class="card">
					<h2 class="text-2xl font-bold text-center mb-6">Login Admin</h2>

					<form onSubmit={handleSubmit} class="space-y-4">
						<div>
							<label class="label" for="username">Username</label>
							<input
								type="text"
								id="username"
								value={username()}
								onInput={(e) => setUsername(e.currentTarget.value)}
								required
								class="input"
								placeholder="admin"
							/>
						</div>

						<div>
							<label class="label" for="password">Password</label>
							<input
								type="password"
								id="password"
								value={password()}
								onInput={(e) => setPassword(e.currentTarget.value)}
								required
								class="input"
								placeholder="••••••••"
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading()}
							class="btn btn-primary w-full"
						>
							{isLoading() ? 'Masuk...' : 'Masuk'}
						</button>
					</form>

					<div class="mt-4 text-center">
						<button
							onClick={() => navigate('/')}
							class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
						>
							← Kembali ke halaman input
						</button>
					</div>
				</div>
			</div>

			<Show when={showToast()}>
				<Toast
					message={toastMessage()}
					type="error"
					onClose={() => setShowToast(false)}
				/>
			</Show>
		</div>
	);
};

export default Login;
