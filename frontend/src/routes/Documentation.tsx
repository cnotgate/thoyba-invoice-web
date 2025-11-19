import { Component, createSignal, For } from 'solid-js';

interface Section {
	id: string;
	title: string;
	content: string;
	subsections?: { title: string; content: string }[];
}

const Documentation: Component = () => {
	const [activeSection, setActiveSection] = createSignal('quick-start');

	const sections: Section[] = [
		{
			id: 'quick-start',
			title: 'Quick Start',
			content: `
				<h2 class="text-2xl font-bold mb-4">Quick Start Guide</h2>
				<p class="mb-4">Welcome to the Invoice Management System! This guide will help you get started quickly.</p>
				
				<h3 class="text-xl font-semibold mb-2 mt-6">Features</h3>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>✅ Public Invoice Form - Anyone can submit invoices</li>
					<li>✅ Admin Dashboard - Manage all invoices with authentication</li>
					<li>✅ Search & Filter - Find invoices quickly</li>
					<li>✅ Payment Tracking - Mark invoices as paid/unpaid</li>
					<li>✅ Supplier Management - Add and manage suppliers</li>
					<li>✅ User Management - Create and manage admin users</li>
					<li>✅ Dark Mode - Easy on the eyes 🌙</li>
					<li>✅ High Performance - Stats caching with 10-20x faster dashboard</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Default Admin Credentials</h3>
				<div class="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
					<p class="font-mono">Username: <strong>admin</strong></p>
					<p class="font-mono">Password: <strong>admin123</strong></p>
					<p class="text-sm mt-2">⚠️ Change the default password immediately after first login!</p>
				</div>

				<h3 class="text-xl font-semibold mb-2 mt-6">Public Invoice Form</h3>
				<p class="mb-4">To submit an invoice, simply go to the homepage and fill out the form:</p>
				<ol class="list-decimal list-inside space-y-2 mb-4">
					<li>Enter the invoice number</li>
					<li>Select or enter a supplier name</li>
					<li>Enter the amount (in Indonesian format: 1.000.000,00)</li>
					<li>Click "Submit Invoice"</li>
				</ol>
			`,
		},
		{
			id: 'admin-guide',
			title: 'Admin Guide',
			content: `
				<h2 class="text-2xl font-bold mb-4">Admin Guide</h2>
				
				<h3 class="text-xl font-semibold mb-2 mt-6">Login</h3>
				<p class="mb-4">Navigate to <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/login</code> and enter your credentials.</p>

				<h3 class="text-xl font-semibold mb-2 mt-6">Dashboard</h3>
				<p class="mb-4">The dashboard provides an overview of:</p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>Total number of invoices</li>
					<li>Paid invoices count</li>
					<li>Unpaid invoices count</li>
					<li>Total value of all invoices (in Rupiah)</li>
				</ul>
				<p class="mb-4">Dashboard stats are cached for high performance and update automatically.</p>

				<h3 class="text-xl font-semibold mb-2 mt-6">Invoice Management</h3>
				<p class="mb-4">In the Invoices page, you can:</p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><strong>Search:</strong> Find invoices by number or supplier name</li>
					<li><strong>Filter:</strong> Show only paid or unpaid invoices</li>
					<li><strong>Update Status:</strong> Mark invoices as paid or unpaid</li>
					<li><strong>Delete:</strong> Remove invoices from the system</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Supplier Management</h3>
				<p class="mb-4">Add new suppliers to be used when creating invoices:</p>
				<ol class="list-decimal list-inside space-y-2 mb-4">
					<li>Go to Suppliers page</li>
					<li>Click "Add New Supplier"</li>
					<li>Enter supplier name</li>
					<li>Click "Add Supplier"</li>
				</ol>

				<h3 class="text-xl font-semibold mb-2 mt-6">User Management</h3>
				<p class="mb-4">Create and manage admin users:</p>
				<ol class="list-decimal list-inside space-y-2 mb-4">
					<li>Go to Users page</li>
					<li>Click "Add New User"</li>
					<li>Enter username and password</li>
					<li>Select role (admin or user)</li>
					<li>Click "Create User"</li>
				</ol>
				<p class="mb-4">You can also change user passwords by clicking the "Change Password" button.</p>

				<h3 class="text-xl font-semibold mb-2 mt-6">Settings</h3>
				<p class="mb-4">In Settings, you can:</p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>Change your own password</li>
					<li>View system information</li>
					<li>Logout from all devices</li>
				</ul>
			`,
		},
		{
			id: 'api',
			title: 'API Reference',
			content: `
				<h2 class="text-2xl font-bold mb-4">API Reference</h2>
				<p class="mb-4">The system provides a RESTful API for programmatic access.</p>

				<h3 class="text-xl font-semibold mb-2 mt-6">Authentication</h3>
				<p class="mb-4">Most API endpoints require JWT authentication. Include the token in the Authorization header:</p>
				<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto"><code>Authorization: Bearer &lt;your-token&gt;</code></pre>

				<h3 class="text-xl font-semibold mb-2 mt-6">POST /api/auth/login</h3>
				<p class="mb-2">Login and get JWT token.</p>
				<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto"><code>{
  "username": "admin",
  "password": "admin123"
}</code></pre>

				<h3 class="text-xl font-semibold mb-2 mt-6">GET /api/invoices</h3>
				<p class="mb-2">Get all invoices (authenticated).</p>
				<p class="mb-2">Query parameters:</p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">search</code> - Search by invoice number or supplier</li>
					<li><code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">status</code> - Filter by paid/unpaid</li>
					<li><code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">limit</code> - Results per page (default: 100)</li>
					<li><code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">offset</code> - Pagination offset (default: 0)</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">POST /api/invoices</h3>
				<p class="mb-2">Create new invoice (no authentication required).</p>
				<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto"><code>{
  "invoice_number": "INV-001",
  "supplier_id": 1,
  "amount": "1.000.000,00"
}</code></pre>

				<h3 class="text-xl font-semibold mb-2 mt-6">GET /api/invoices/stats</h3>
				<p class="mb-2">Get cached statistics (authenticated).</p>
				<p class="mb-4">Returns total invoices, paid count, unpaid count, and total value.</p>

				<h3 class="text-xl font-semibold mb-2 mt-6">GET /api/suppliers/list</h3>
				<p class="mb-2">Get all suppliers (no authentication required).</p>

				<p class="mt-6 mb-4">For complete API documentation, see <a href="https://github.com/cnotgate/thoyba-invoice-web/blob/master/DOCUMENTATION.md" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">DOCUMENTATION.md on GitHub</a>.</p>
			`,
		},
		{
			id: 'tech-stack',
			title: 'Technology Stack',
			content: `
				<h2 class="text-2xl font-bold mb-4">Technology Stack</h2>
				
				<h3 class="text-xl font-semibold mb-2 mt-6">Frontend</h3>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><strong>SolidJS</strong> - Reactive UI framework (faster than React)</li>
					<li><strong>TypeScript</strong> - Type safety</li>
					<li><strong>TailwindCSS</strong> - Modern styling</li>
					<li><strong>Vite</strong> - Lightning-fast builds</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Backend</h3>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><strong>Bun</strong> - Ultra-fast JavaScript runtime (3-4x faster than Node.js)</li>
					<li><strong>Hono</strong> - Lightweight web framework</li>
					<li><strong>PostgreSQL</strong> - Reliable relational database</li>
					<li><strong>Drizzle ORM</strong> - Type-safe database queries</li>
					<li><strong>JWT</strong> - Secure authentication</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Infrastructure</h3>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><strong>Docker</strong> - Containerization</li>
					<li><strong>Docker Compose</strong> - Orchestration</li>
					<li><strong>Nginx</strong> - Reverse proxy</li>
					<li><strong>Let's Encrypt</strong> - SSL certificates</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Performance Features</h3>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><strong>Stats Caching</strong> - PostgreSQL triggers for 10-20x faster dashboard</li>
					<li><strong>Database Indexes</strong> - Optimized query performance</li>
					<li><strong>Indonesian Currency Support</strong> - Proper parsing of "4.000.000,00" format</li>
					<li><strong>Auto-sync</strong> - Real-time stats updates</li>
				</ul>
			`,
		},
		{
			id: 'troubleshooting',
			title: 'Troubleshooting',
			content: `
				<h2 class="text-2xl font-bold mb-4">Troubleshooting</h2>
				
				<h3 class="text-xl font-semibold mb-2 mt-6">Login Issues</h3>
				<p class="mb-4"><strong>Problem:</strong> Cannot login or "Invalid credentials" error.</p>
				<p class="mb-4"><strong>Solution:</strong></p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>Verify you're using correct username and password</li>
					<li>Check browser console for errors</li>
					<li>Clear browser cache and cookies</li>
					<li>Try using default credentials: admin / admin123</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Username Shows "Unknown"</h3>
				<p class="mb-4"><strong>Problem:</strong> Username appears as "unknown" after page refresh.</p>
				<p class="mb-4"><strong>Solution:</strong> This has been fixed in the latest version. Clear your browser cache or logout and login again.</p>

				<h3 class="text-xl font-semibold mb-2 mt-6">Stats Not Updating</h3>
				<p class="mb-4"><strong>Problem:</strong> Dashboard statistics not reflecting recent changes.</p>
				<p class="mb-4"><strong>Solution:</strong></p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>Stats should update automatically via database triggers</li>
					<li>Try refreshing the page (Ctrl+F5)</li>
					<li>Contact system administrator if issue persists</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Currency Format</h3>
				<p class="mb-4"><strong>Problem:</strong> How to enter currency amounts?</p>
				<p class="mb-4"><strong>Solution:</strong> Use Indonesian format with dots for thousands and comma for decimal:</p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>1 million = 1.000.000,00</li>
					<li>4 million = 4.000.000,00</li>
					<li>500 thousand = 500.000,00</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Invoice Submission Failed</h3>
				<p class="mb-4"><strong>Problem:</strong> Cannot submit invoice from public form.</p>
				<p class="mb-4"><strong>Solution:</strong></p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>Verify all fields are filled correctly</li>
					<li>Check invoice number is unique (not already in system)</li>
					<li>Ensure supplier is selected or entered</li>
					<li>Use correct currency format</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Dark Mode Not Working</h3>
				<p class="mb-4"><strong>Problem:</strong> Theme toggle doesn't change appearance.</p>
				<p class="mb-4"><strong>Solution:</strong></p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li>Click the sun/moon icon in the navbar</li>
					<li>Preference is saved in browser localStorage</li>
					<li>Clear browser data if issue persists</li>
				</ul>

				<h3 class="text-xl font-semibold mb-2 mt-6">Need More Help?</h3>
				<p class="mb-4">For detailed technical documentation and deployment guides, visit:</p>
				<ul class="list-disc list-inside space-y-2 mb-4">
					<li><a href="https://github.com/cnotgate/thoyba-invoice-web" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">GitHub Repository</a></li>
					<li><a href="https://github.com/cnotgate/thoyba-invoice-web/blob/master/DOCUMENTATION.md" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Complete Documentation</a></li>
					<li><a href="https://github.com/cnotgate/thoyba-invoice-web/issues" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Report an Issue</a></li>
				</ul>
			`,
		},
	];

	return (
		<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div class="container mx-auto px-4 py-8">
				<div class="mb-8">
					<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
						Documentation
					</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Learn how to use the Invoice Management System
					</p>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
					{/* Sidebar */}
					<div class="lg:col-span-1">
						<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-4">
							<h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
								Table of Contents
							</h2>
							<nav class="space-y-2">
								<For each={sections}>
									{(section) => (
										<button
											onClick={() => setActiveSection(section.id)}
											class={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
												activeSection() === section.id
													? 'bg-blue-500 text-white'
													: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
											}`}
										>
											{section.title}
										</button>
									)}
								</For>
							</nav>

							<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
								<h3 class="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
									Quick Links
								</h3>
								<div class="space-y-2 text-sm">
									<a
										href="/"
										class="block text-blue-600 dark:text-blue-400 hover:underline"
									>
										← Back to Home
									</a>
									<a
										href="/login"
										class="block text-blue-600 dark:text-blue-400 hover:underline"
									>
										Admin Login
									</a>
									<a
										href="https://github.com/cnotgate/thoyba-invoice-web"
										target="_blank"
										rel="noopener noreferrer"
										class="block text-blue-600 dark:text-blue-400 hover:underline"
									>
										GitHub Repository ↗
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Content */}
					<div class="lg:col-span-3">
						<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
							<For each={sections}>
								{(section) => (
									<div
										class={activeSection() === section.id ? 'block' : 'hidden'}
									>
										<div
											class="prose dark:prose-invert max-w-none"
											innerHTML={section.content}
										/>
									</div>
								)}
							</For>
						</div>

						{/* Footer */}
						<div class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
							<p>
								Built with ❤️ using SolidJS, Bun, and PostgreSQL
							</p>
							<p class="mt-2">
								For complete technical documentation, visit{' '}
								<a
									href="https://github.com/cnotgate/thoyba-invoice-web/blob/master/DOCUMENTATION.md"
									target="_blank"
									rel="noopener noreferrer"
									class="text-blue-600 dark:text-blue-400 hover:underline"
								>
									DOCUMENTATION.md
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Documentation;
