import { Component, Show } from 'solid-js';
import { useTheme } from '../stores/themeStore';

const Navbar: Component<{ title?: string }> = (props) => {
	const { isDark, toggleTheme } = useTheme();

	return (
		<nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex justify-between items-center h-16">
					<h1 class="text-2xl font-bold text-gray-800 dark:text-white">
						{props.title || 'CV. Amlaza Baraka'}
					</h1>

					<button
						onClick={toggleTheme}
						class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						title="Toggle theme"
					>
						<Show
							when={isDark()}
							fallback={
								<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
									/>
								</svg>
							}
						>
							<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
						</Show>
					</button>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
