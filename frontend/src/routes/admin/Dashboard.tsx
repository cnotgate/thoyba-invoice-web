import { Component, createResource, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { api } from '../../services/api';
import { BsFileEarmarkText, BsCheckCircleFill, BsClock, BsCurrencyDollar, BsArrowRight } from 'solid-icons/bs';

const Dashboard: Component = () => {
	const [stats] = createResource(async () => {
		// Use the new lightweight stats endpoint
		return await api.getDashboardStats();
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
		}).format(value);
	};

	const formatCompactCurrency = (value: number) => {
		if (value >= 1000000000000) {
			// Triliun
			return `Rp ${(value / 1000000000000).toFixed(1)} Triliun`;
		} else if (value >= 1000000000) {
			// Miliar
			return `Rp ${(value / 1000000000).toFixed(1)} Miliar`;
		} else if (value >= 1000000) {
			// Juta
			return `Rp ${(value / 1000000).toFixed(1)} Juta`;
		} else {
			return new Intl.NumberFormat('id-ID', {
				style: 'currency',
				currency: 'IDR',
				minimumFractionDigits: 0,
			}).format(value);
		}
	};

	const formatDate = (dateStr: string) => {
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
	};

	return (
		<div class="space-y-6">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
			</div>

			<Show when={!stats.loading} fallback={<div class="text-center py-8">Memuat...</div>}>
				<Show when={stats()}>
					{(data) => (
						<>
							<div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
								{/* Total Invoice - Full width on mobile */}
								<div class="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
									<div class="flex items-center justify-between">
										<div>
											<p class="text-sm text-gray-600 dark:text-gray-400">Total Invoice</p>
											<p class="text-3xl font-bold text-gray-900 dark:text-white mt-2">
												{data().total}
											</p>
										</div>
										<div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
											<BsFileEarmarkText size={28} />
										</div>
									</div>
								</div>

								{/* Paid - Side by side with Unpaid on mobile */}
								<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
									<div class="flex flex-col md:flex-row md:items-center md:justify-between">
										<div class="flex-1">
											<p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">Lunas</p>
											<p class="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mt-1 md:mt-2">
												{data().paid}
											</p>
										</div>
										<div class="hidden md:flex w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg items-center justify-center text-green-600 dark:text-green-400">
											<BsCheckCircleFill size={28} />
										</div>
									</div>
									<div class="mt-2 text-xs md:text-sm text-gray-500">
										{data().total > 0 ? Math.round((data().paid / data().total) * 100) : 0}% dari total
									</div>
								</div>

								{/* Unpaid - Side by side with Paid on mobile */}
								<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
									<div class="flex flex-col md:flex-row md:items-center md:justify-between">
										<div class="flex-1">
											<p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">Belum Lunas</p>
											<p class="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 mt-1 md:mt-2">
												{data().unpaid}
											</p>
										</div>
										<div class="hidden md:flex w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg items-center justify-center text-red-600 dark:text-red-400">
											<BsClock size={28} />
										</div>
									</div>
									<div class="mt-2 text-xs md:text-sm text-gray-500">
										{data().total > 0 ? Math.round((data().unpaid / data().total) * 100) : 0}% dari total
									</div>
								</div>

								{/* Total Value - Full width on mobile */}
								<div class="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
									<div class="flex items-center justify-between">
										<div class="flex-1 min-w-0">
											<p class="text-sm text-gray-600 dark:text-gray-400">Total Nilai</p>
											<p class="text-2xl font-bold text-gray-900 dark:text-white mt-2 break-words" title={formatCurrency(data().totalValue)}>
												{formatCompactCurrency(data().totalValue)}
											</p>
										</div>
										<div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
											<BsCurrencyDollar size={28} />
										</div>
									</div>
								</div>
							</div>

							<div class="bg-white dark:bg-gray-800 rounded-lg shadow">
								<div class="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
									<h2 class="text-xl font-bold text-gray-900 dark:text-white">Invoice Terbaru</h2>
									<A
										href="/admin/invoices"
										class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
									>
										Lihat Semua
										<BsArrowRight class="w-4 h-4" />
									</A>
								</div>
								<div class="overflow-x-auto">
									<table class="w-full">
										<thead class="bg-gray-50 dark:bg-gray-700">
											<tr>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
													Tanggal
												</th>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
													Supplier
												</th>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
													No. Invoice
												</th>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
													Total
												</th>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
													Status
												</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
											{data().recent.map((invoice) => (
												<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
													<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
														{formatDate(invoice.date || '')}
													</td>
													<td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
														{invoice.supplier}
													</td>
													<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
														{invoice.invoiceNumber}
													</td>
													<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
														{formatCurrency(parseFloat(invoice.total.replace(/[^0-9.-]+/g, '')))}
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<span
															class={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.paid
																? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
																: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
																}`}
														>
															{invoice.paid ? 'Lunas' : 'Belum Lunas'}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)}
				</Show>
			</Show>
		</div>
	);
};

export default Dashboard;
