import { Component, Show, createSignal, onMount } from 'solid-js';

interface ToastProps {
	message: string;
	type?: 'success' | 'error' | 'info';
	duration?: number;
	onClose?: () => void;
}

const Toast: Component<ToastProps> = (props) => {
	const [visible, setVisible] = createSignal(true);

	onMount(() => {
		const timer = setTimeout(() => {
			setVisible(false);
			props.onClose?.();
		}, props.duration || 3000);

		return () => clearTimeout(timer);
	});

	const bgColor = () => {
		switch (props.type) {
			case 'success':
				return 'bg-green-500';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-blue-500';
		}
	};

	return (
		<Show when={visible()}>
			<div
				class={`fixed bottom-4 right-4 ${bgColor()} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`}
			>
				{props.message}
			</div>
		</Show>
	);
};

export default Toast;
