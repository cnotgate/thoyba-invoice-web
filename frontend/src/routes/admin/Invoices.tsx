import { createSignal, createEffect, For, Show, onCleanup } from 'solid-js';
import { api } from '../../services/api';
import type { Invoice } from '../../types';
import { BsSearch, BsArrowRepeat, BsTrash, BsXCircle, BsPencil } from 'solid-icons/bs';
import Toast from '../../components/Toast';
import { formatWithThousandsSeparator, toDecimalString } from '../../utils/currency';

export default function Invoices() {
    const [allInvoices, setAllInvoices] = createSignal<Invoice[]>([]);
    const [displayedInvoices, setDisplayedInvoices] = createSignal<Invoice[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [loadingMore, setLoadingMore] = createSignal(false);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [statusFilter, setStatusFilter] = createSignal<'all' | 'paid' | 'unpaid'>('all');
    const [sortBy, setSortBy] = createSignal<'timestamp-desc' | 'timestamp-asc' | 'date-desc' | 'date-asc' | 'supplier-asc' | 'supplier-desc' | 'status'>('timestamp-desc');
    const [hasMoreServer, setHasMoreServer] = createSignal(true);
    const [showPaymentModal, setShowPaymentModal] = createSignal(false);
    const [showDeleteModal, setShowDeleteModal] = createSignal(false);
    const [showEditModal, setShowEditModal] = createSignal(false);
    const [showUnpayConfirmModal, setShowUnpayConfirmModal] = createSignal(false);
    const [selectedInvoice, setSelectedInvoice] = createSignal<Invoice | null>(null);
    const [paymentDate, setPaymentDate] = createSignal('');
    const [showTimestamp, setShowTimestamp] = createSignal(false);
    const [editForm, setEditForm] = createSignal({
        supplier: '',
        branch: 'Kuripan' as 'Kuripan' | 'Cempaka' | 'Gatot',
        date: '',
        invoiceNumber: '',
        total: '',
        description: ''
    });
    const BATCH_SIZE = 50;

    // Store reference to scroll container to avoid repeated DOM queries
    let scrollContainerRef: Element | null = null;

    // Toast
    const [showToast, setShowToast] = createSignal(false);
    const [toastMessage, setToastMessage] = createSignal('');
    const [toastType, setToastType] = createSignal<'success' | 'error' | 'info'>('success');

    function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    }

    // Load invoices with server-side filtering
    async function loadInvoices(reset = false) {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const offset = reset ? 0 : allInvoices().length;
            const invoices = await api.getInvoices(
                BATCH_SIZE,
                offset,
                searchQuery(),
                statusFilter()
            );

            if (reset) {
                setAllInvoices(invoices);
                setDisplayedInvoices(invoices);
            } else {
                setAllInvoices([...allInvoices(), ...invoices]);
                setDisplayedInvoices([...displayedInvoices(), ...invoices]);
            }

            setHasMoreServer(invoices.length === BATCH_SIZE);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    // Load invoices on mount and when search/filter changes
    createEffect(() => {
        // Track dependencies to make this effect reactive
        searchQuery();
        statusFilter();

        // Debounce to avoid excessive API calls while typing
        const timeoutId = setTimeout(() => {
            loadInvoices(true);
        }, 300);

        return () => clearTimeout(timeoutId);
    });

    // Apply client-side sorting only (filtering is done on server)
    const filteredInvoices = () => {
        let filtered = [...displayedInvoices()];

        // Apply sorting
        const sort = sortBy();
        filtered.sort((a, b) => {
            switch (sort) {
                case 'timestamp-desc':
                    return parseTimestamp(b.timestamp || '') - parseTimestamp(a.timestamp || '');
                case 'timestamp-asc':
                    return parseTimestamp(a.timestamp || '') - parseTimestamp(b.timestamp || '');
                case 'date-desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'supplier-asc':
                    return a.supplier.localeCompare(b.supplier);
                case 'supplier-desc':
                    return b.supplier.localeCompare(a.supplier);
                case 'status':
                    return (a.paid === b.paid) ? 0 : a.paid ? -1 : 1;
                default:
                    return 0;
            }
        });

        return filtered;
    };

    // Parse timestamp DD/MM/YYYY HH:mm:ss
    function parseTimestamp(timestampStr: string): number {
        if (!timestampStr) return 0;
        const parts = timestampStr.split(' ');
        if (parts.length !== 2) return new Date(timestampStr).getTime();

        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
    }

    // Load more invoices from server
    function loadMoreFromServer() {
        if (!hasMoreServer() || loadingMore()) return;
        loadInvoices(false);
    }

    // Handle scroll to load more
    const handleScroll = () => {
        if (!scrollContainerRef) return;

        const el = scrollContainerRef as HTMLElement;
        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Load more when 200px from bottom
        if (distanceFromBottom < 200 && !loadingMore() && hasMoreServer()) {
            loadMoreFromServer();
        }
    };

    // Attach scroll listener after component mounts and data is loaded
    createEffect(() => {
        // Wait for data to be loaded and displayed
        if (!loading() && displayedInvoices().length > 0) {
            // Always re-find container element (important after re-renders)
            const container = document.querySelector('.invoice-container');
            if (container) {
                container.addEventListener('scroll', handleScroll);

                // Store ref for cleanup
                scrollContainerRef = container;

                // Cleanup when effect re-runs or component unmounts
                onCleanup(() => {
                    container.removeEventListener('scroll', handleScroll);
                });
            }
        }
    });



    // Refresh data
    async function handleRefresh() {
        await loadInvoices(true);
    }

    // Toggle paid status
    function handleTogglePaid(invoice: Invoice) {
        setSelectedInvoice(invoice);
        if (invoice.paid) {
            // Show confirmation modal before unpaying
            setShowUnpayConfirmModal(true);
        } else {
            // Show payment date modal
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setShowPaymentModal(true);
        }
    }

    // Confirm unpay invoice
    async function handleConfirmUnpay() {
        const invoice = selectedInvoice();
        if (!invoice) return;

        await updateInvoiceStatus(invoice.id, false, '');
        setShowUnpayConfirmModal(false);
        setSelectedInvoice(null);
    }

    // Cancel unpay confirmation
    function handleCancelUnpay() {
        setShowUnpayConfirmModal(false);
        setSelectedInvoice(null);
    }

    // Update invoice status
    async function updateInvoiceStatus(id: number, paid: boolean, paidDate: string) {
        try {
            await api.updateInvoice(id, { paid, paidDate: paid ? paidDate : undefined });

            // Reload data from server with current filters
            await loadInvoices(true);

            // Show toast
            triggerToast(paid ? 'Invoice ditandai Lunas' : 'Invoice ditandai Belum Lunas', 'success');
        } catch (error) {
            console.error('Error updating invoice:', error);
            triggerToast('Gagal mengubah status pembayaran', 'error');
        }
    }

    // Delete invoice
    function handleDeleteClick(invoice: Invoice) {
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
    }

    async function handleDeleteConfirm() {
        const invoice = selectedInvoice();
        if (!invoice) return;

        try {
            await api.deleteInvoice(invoice.id);

            // Reload data from server with current filters
            await loadInvoices(true);

            setShowDeleteModal(false);
            setSelectedInvoice(null);
        } catch (error) {
            console.error('Error deleting invoice:', error);
            triggerToast('Gagal menghapus invoice', 'error');
        }
    }

    // Edit invoice
    function handleEditClick(invoice: Invoice) {
        setSelectedInvoice(invoice);
        setEditForm({
            supplier: invoice.supplier,
            branch: invoice.branch,
            date: invoice.date,
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total.replace(/[^0-9.-]/g, ''),
            description: invoice.description || ''
        });
        setShowEditModal(true);
    }

    async function handleEditSubmit(e: Event) {
        e.preventDefault();
        const invoice = selectedInvoice();
        if (!invoice) return;

        const form = editForm();
        try {
            // Convert total to decimal string before submitting
            await api.updateInvoice(invoice.id, {
                supplier: form.supplier,
                branch: form.branch,
                date: form.date,
                invoiceNumber: form.invoiceNumber,
                total: toDecimalString(form.total),
                description: form.description
            });

            // Reload data from server with current filters
            await loadInvoices(true);

            setShowEditModal(false);
            setSelectedInvoice(null);
            triggerToast('Invoice berhasil diupdate', 'success');
        } catch (error) {
            console.error('Error updating invoice:', error);
            triggerToast('Gagal mengupdate invoice', 'error');
        }
    }

    // Format currency
    function formatCurrency(value: string): string {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    }

    // Format date
    function formatDate(dateStr: string): string {
        if (!dateStr) return 'Invalid Date';

        // Try parsing DD/MM/YYYY format (Indonesian format)
        const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                });
            }
        }

        // Try parsing YYYY-MM-DD format (ISO format)
        const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            const [, year, month, day] = isoMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                });
            }
        }

        // Fallback: try native Date parsing
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }

        // If all parsing fails, return the original string
        return dateStr;
    }

    function formatTimestamp(timestampStr: string | null | undefined): string {
        if (!timestampStr) return '-';

        const date = new Date(timestampStr);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        });
    }

    return (
        <div>
            {/* Header */}
            <div class="mb-6">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Daftar Invoice
                </h1>
            </div>

            {/* Filters */}
            <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-2 md:p-4 mb-3 md:mb-6">
                {/* Search bar - full width on mobile, inline on desktop */}
                <div class="mb-2 lg:mb-0 lg:flex lg:gap-2 lg:items-center">
                    <div class="relative lg:flex-1">
                        <BsSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari supplier atau no. invoice..."
                            class="w-full pl-8 pr-3 py-1.5 md:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                        />
                    </div>

                    {/* Desktop: All filters inline with search */}
                    <div class="hidden lg:flex lg:gap-2">
                        {/* Status Filter */}
                        <select
                            class="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={statusFilter()}
                            onChange={(e) => setStatusFilter(e.currentTarget.value as any)}
                        >
                            <option value="all">Semua Status</option>
                            <option value="paid">Sudah Dibayar</option>
                            <option value="unpaid">Belum Dibayar</option>
                        </select>

                        {/* Sort */}
                        <select
                            class="w-52 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={sortBy()}
                            onChange={(e) => setSortBy(e.currentTarget.value as any)}
                        >
                            <option value="timestamp-desc">Terbaru</option>
                            <option value="timestamp-asc">Terlama</option>
                            <option value="date-desc">Tgl Faktur Terbaru</option>
                            <option value="date-asc">Tgl Faktur Terlama</option>
                            <option value="supplier-asc">Supplier A-Z</option>
                            <option value="supplier-desc">Supplier Z-A</option>
                            <option value="status">Status</option>
                        </select>

                        {/* Toggle Timestamp */}
                        <label class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            <input
                                type="checkbox"
                                checked={showTimestamp()}
                                onChange={(e) => setShowTimestamp(e.currentTarget.checked)}
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span class="whitespace-nowrap">Tampilkan Timestamp</span>
                        </label>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={loading()}
                            class="flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                            <BsArrowRepeat class={`w-4 h-4 ${loading() ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Mobile & Tablet: Filters in separate row */}
                <div class="flex gap-2 lg:hidden">
                    {/* Status Filter - compact */}
                    <div class="flex-1">
                        <select
                            class="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={statusFilter()}
                            onChange={(e) => setStatusFilter(e.currentTarget.value as any)}
                        >
                            <option value="all">Semua</option>
                            <option value="paid">Lunas</option>
                            <option value="unpaid">Belum</option>
                        </select>
                    </div>

                    {/* Sort - compact */}
                    <div class="flex-1">
                        <select
                            class="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={sortBy()}
                            onChange={(e) => setSortBy(e.currentTarget.value as any)}
                        >
                            <option value="timestamp-desc">Terbaru</option>
                            <option value="timestamp-asc">Terlama</option>
                            <option value="date-desc">Tgl Faktur ↓</option>
                            <option value="date-asc">Tgl Faktur ↑</option>
                            <option value="supplier-asc">A-Z</option>
                            <option value="supplier-desc">Z-A</option>
                            <option value="status">Status</option>
                        </select>
                    </div>

                    {/* Refresh Button - icon only */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading()}
                        class="flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                        <BsArrowRepeat class={`w-4 h-4 ${loading() ? 'animate-spin' : ''}`} />
                        <span class="hidden md:inline">Refresh</span>
                    </button>
                </div>
            </div>            {/* Invoice List */}
            <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                <Show when={!loading()} fallback={
                    <div class="flex flex-col items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p class="mt-4 text-gray-600 dark:text-gray-400">Memuat invoice...</p>
                    </div>
                }>
                    <Show when={displayedInvoices().length > 0} fallback={
                        <div class="flex flex-col items-center justify-center py-12">
                            <BsXCircle class="w-16 h-16 text-gray-400 mb-4" />
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Tidak ada invoice
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400">
                                {searchQuery() || statusFilter() !== 'all'
                                    ? 'Tidak ada invoice yang sesuai dengan filter'
                                    : 'Belum ada invoice yang dibuat'}
                            </p>
                        </div>
                    }>
                        <div class="invoice-container overflow-auto" style="height: calc(100vh - 280px); min-height: 400px;">
                            {/* Desktop Table */}
                            <div class="hidden md:block overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                        <tr>
                                            <Show when={showTimestamp()}>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Timestamp
                                                </th>
                                            </Show>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Supplier
                                            </th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                No. Invoice
                                            </th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Cabang
                                            </th>
                                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <For each={filteredInvoices()}>
                                            {(invoice) => (
                                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <Show when={showTimestamp()}>
                                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {formatTimestamp(invoice.timestamp)}
                                                        </td>
                                                    </Show>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {formatDate(invoice.date)}
                                                    </td>
                                                    <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                        {invoice.supplier}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                                                        {invoice.invoiceNumber}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {invoice.branch}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(invoice.total)}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-center">
                                                        <div class="flex items-center justify-center gap-1.5">
                                                            <span class={`text-xs font-medium ${invoice.paid
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {invoice.paid ? 'Lunas' : 'Belum Lunas'}
                                                            </span>
                                                            <button
                                                                onClick={() => handleTogglePaid(invoice)}
                                                                class={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${invoice.paid
                                                                    ? 'bg-green-500 focus:ring-green-500'
                                                                    : 'bg-red-500 focus:ring-red-500'
                                                                    }`}
                                                                role="switch"
                                                                aria-checked={invoice.paid}
                                                            >
                                                                <span
                                                                    class={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${invoice.paid ? 'translate-x-5' : 'translate-x-0.5'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-center">
                                                        <div class="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleEditClick(invoice)}
                                                                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-xs font-semibold transition-colors"
                                                            >
                                                                <BsPencil class="w-3 h-3" />
                                                                <span>Edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(invoice)}
                                                                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg text-xs font-semibold transition-colors"
                                                            >
                                                                <BsTrash class="w-3 h-3" />
                                                                <span>Hapus</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                                <For each={filteredInvoices()}>
                                    {(invoice) => (
                                        <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <div class="flex justify-between items-start gap-2 mb-3">
                                                <div class="flex-1 min-w-0">
                                                    <p class="font-semibold text-gray-900 dark:text-white truncate">
                                                        {invoice.supplier}
                                                    </p>
                                                    <p class="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                        {invoice.invoiceNumber}
                                                    </p>
                                                </div>
                                                <div class="flex items-center gap-1.5 flex-shrink-0">
                                                    <span class={`text-xs font-medium ${invoice.paid
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {invoice.paid ? 'Lunas' : 'Belum'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleTogglePaid(invoice)}
                                                        class={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${invoice.paid
                                                            ? 'bg-green-500 focus:ring-green-500'
                                                            : 'bg-red-500 focus:ring-red-500'
                                                            }`}
                                                        role="switch"
                                                        aria-checked={invoice.paid}
                                                    >
                                                        <span
                                                            class={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${invoice.paid ? 'translate-x-5' : 'translate-x-0.5'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="space-y-1 mb-3">
                                                {/* Timestamp - always show on mobile */}
                                                <p class="text-xs text-gray-500 dark:text-gray-500">
                                                    <span class="font-medium">Timestamp:</span> {formatTimestamp(invoice.timestamp)}
                                                </p>
                                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                                    <span class="font-medium">Tanggal:</span> {formatDate(invoice.date)}
                                                </p>
                                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                                    <span class="font-medium">Cabang:</span> {invoice.branch}
                                                </p>
                                                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(invoice.total)}
                                                </p>
                                            </div>
                                            <div class="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => handleEditClick(invoice)}
                                                    class="flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    <BsPencil class="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(invoice)}
                                                    class="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    <BsTrash class="w-4 h-4" />
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>

                            {/* Loading More Indicator */}
                            <Show when={loadingMore()}>
                                <div class="flex justify-center items-center py-4 border-t border-gray-200 dark:border-gray-700">
                                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span class="ml-3 text-sm text-gray-600 dark:text-gray-400">
                                        Memuat lebih banyak...
                                    </span>
                                </div>
                            </Show>

                            {/* End of List */}
                            <Show when={!hasMoreServer() && displayedInvoices().length > 0}>
                                <div class="py-4 text-center border-t border-gray-200 dark:border-gray-700">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Semua invoice telah ditampilkan ({displayedInvoices().length} invoice)
                                    </p>
                                </div>
                            </Show>

                            {/* Scroll to load more hint */}
                            <Show when={hasMoreServer() && displayedInvoices().length > 0 && !loadingMore()}>
                                <div class="py-3 text-center border-t border-gray-200 dark:border-gray-700">
                                    <p class="text-xs text-gray-400 dark:text-gray-500">
                                        Scroll ke bawah untuk memuat lebih banyak...
                                    </p>
                                </div>
                            </Show>
                        </div>
                    </Show>
                </Show>
            </div>

            {/* Payment Date Modal */}
            <Show when={showPaymentModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Masukkan Tanggal Pembayaran
                            </h3>
                            <form onSubmit={handlePaymentSubmit}>
                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tanggal Pembayaran
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={paymentDate()}
                                        onInput={(e) => setPaymentDate(e.currentTarget.value)}
                                    />
                                </div>
                                <div class="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Edit Invoice Modal */}
            <Show when={showEditModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                    Edit Invoice
                                </h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <BsXCircle class="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Supplier */}
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Supplier *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm().supplier}
                                            onInput={(e) => setEditForm({ ...editForm(), supplier: e.currentTarget.value })}
                                        />
                                    </div>

                                    {/* Branch */}
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Cabang *
                                        </label>
                                        <select
                                            required
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm().branch}
                                            onChange={(e) => setEditForm({ ...editForm(), branch: e.currentTarget.value as any })}
                                        >
                                            <option value="Kuripan">Kuripan</option>
                                            <option value="Cempaka">Cempaka</option>
                                            <option value="Gatot">Gatot</option>
                                        </select>
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tanggal *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm().date}
                                            onInput={(e) => setEditForm({ ...editForm(), date: e.currentTarget.value })}
                                        />
                                    </div>

                                    {/* Invoice Number */}
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            No. Invoice *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm().invoiceNumber}
                                            onInput={(e) => setEditForm({ ...editForm(), invoiceNumber: e.currentTarget.value })}
                                        />
                                    </div>

                                    {/* Total */}
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Total (Rp) *
                                        </label>
                                        <input
                                            type="text"
                                            inputmode="numeric"
                                            required
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm().total}
                                            onInput={(e) => {
                                                // Only allow digits
                                                const value = e.currentTarget.value.replace(/\D/g, '');
                                                setEditForm({ ...editForm(), total: value });
                                            }}
                                            onBlur={(e) => {
                                                // Format on blur
                                                const value = e.currentTarget.value.replace(/\D/g, '');
                                                if (value) {
                                                    e.currentTarget.value = formatWithThousandsSeparator(value);
                                                }
                                            }}
                                            onFocus={(e) => {
                                                // Remove format on focus
                                                e.currentTarget.value = editForm().total;
                                            }}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Deskripsi
                                        </label>
                                        <textarea
                                            rows={3}
                                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editForm().description}
                                            onInput={(e) => setEditForm({ ...editForm(), description: e.currentTarget.value })}
                                        />
                                    </div>
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
                                        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Unpay Confirmation Modal */}
            <Show when={showUnpayConfirmModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Konfirmasi Ubah Status
                            </h3>
                            <div class="mb-6">
                                <div class="flex items-center justify-center mb-4">
                                    <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                                        <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p class="text-gray-700 dark:text-gray-300 mb-3">
                                    Apakah Anda yakin ingin mengubah status invoice ini menjadi <strong>Belum Lunas</strong>?
                                </p>
                                <Show when={selectedInvoice()}>
                                    {(invoice) => (
                                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">Supplier:</span>
                                                <span class="ml-2 text-gray-900 dark:text-white">{invoice().supplier}</span>
                                            </p>
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">No. Invoice:</span>
                                                <span class="ml-2 text-gray-900 dark:text-white font-mono">{invoice().invoiceNumber}</span>
                                            </p>
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">Total:</span>
                                                <span class="ml-2 text-gray-900 dark:text-white font-semibold">{formatCurrency(invoice().total)}</span>
                                            </p>
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">Status Saat Ini:</span>
                                                <span class="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                                                    Lunas
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </Show>
                                <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-4">
                                    <strong>Perhatian:</strong> Invoice akan kembali ke status belum lunas dan tanggal pembayaran akan dihapus.
                                </p>
                            </div>
                            <div class="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancelUnpay}
                                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmUnpay}
                                    class="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                                >
                                    Ubah ke Belum Lunas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Delete Confirmation Modal */}
            <Show when={showDeleteModal()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div class="p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Konfirmasi Hapus Invoice
                            </h3>
                            <div class="mb-6">
                                <div class="flex items-center justify-center mb-4">
                                    <BsTrash class="w-12 h-12 text-red-600" />
                                </div>
                                <p class="text-gray-700 dark:text-gray-300 mb-3">
                                    Apakah Anda yakin ingin menghapus invoice ini?
                                </p>
                                <Show when={selectedInvoice()}>
                                    {(invoice) => (
                                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">Supplier:</span>
                                                <span class="ml-2 text-gray-900 dark:text-white">{invoice().supplier}</span>
                                            </p>
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">No. Invoice:</span>
                                                <span class="ml-2 text-gray-900 dark:text-white font-mono">{invoice().invoiceNumber}</span>
                                            </p>
                                            <p class="text-sm">
                                                <span class="font-medium text-gray-700 dark:text-gray-300">Total:</span>
                                                <span class="ml-2 text-gray-900 dark:text-white font-semibold">{formatCurrency(invoice().total)}</span>
                                            </p>
                                        </div>
                                    )}
                                </Show>
                                <p class="text-sm text-red-600 dark:text-red-400 mt-4">
                                    <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan!
                                </p>
                            </div>
                            <div class="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteConfirm}
                                    class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
            {/* Toast Notifications */}
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
