import { createSignal, createEffect, createRoot } from 'solid-js';

const [isDark, setIsDark] = createSignal(
	localStorage.getItem('theme') === 'dark' ||
		(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
);

// Wrap createEffect in createRoot to avoid the warning
createRoot(() => {
	createEffect(() => {
		const theme = isDark() ? 'dark' : 'light';
		document.documentElement.classList.toggle('dark', isDark());
		localStorage.setItem('theme', theme);
	});
});

export const useTheme = () => ({
	isDark,
	toggleTheme: () => setIsDark(!isDark()),
});
