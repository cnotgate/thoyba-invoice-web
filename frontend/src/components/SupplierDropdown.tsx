import { Component, For, Show, createSignal } from 'solid-js';

interface SupplierDropdownProps {
	suppliers: string[] | undefined;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
}

const SupplierDropdown: Component<SupplierDropdownProps> = (props) => {
	const [search, setSearch] = createSignal(props.value || '');
	const [isOpen, setIsOpen] = createSignal(false);

	const filteredSuppliers = () => {
		if (!props.suppliers) return [];
		const searchTerm = search().toLowerCase();
		return props.suppliers.filter((s) => s.toLowerCase().includes(searchTerm));
	};

	const handleSelect = (supplier: string) => {
		props.onChange(supplier);
		setSearch(supplier);
		setIsOpen(false);
	};

	const handleInput = (value: string) => {
		setSearch(value);
		props.onChange(value);
		setIsOpen(true);
	};

	return (
		<div class="relative">
			<label class="label">
				Nama Supplier {props.required && <span class="text-red-500">*</span>}
			</label>

			<input
				type="text"
				value={search()}
				onInput={(e) => handleInput(e.currentTarget.value)}
				onFocus={() => setIsOpen(true)}
				onBlur={() => setTimeout(() => setIsOpen(false), 200)}
				placeholder="Cari supplier..."
				required={props.required}
				class="input"
			/>

			<Show when={isOpen() && filteredSuppliers().length > 0}>
				<div class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
					<For each={filteredSuppliers()}>
						{(supplier) => (
							<div
								onClick={() => handleSelect(supplier)}
								class="px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer transition-colors"
							>
								{supplier}
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	);
};

export default SupplierDropdown;
