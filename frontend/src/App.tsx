import { lazy, Component } from 'solid-js';
import { Route } from '@solidjs/router';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./routes/Home'));
const Login = lazy(() => import('./routes/Login'));
const Dashboard = lazy(() => import('./routes/admin/Dashboard'));
const Invoices = lazy(() => import('./routes/admin/Invoices'));
const Users = lazy(() => import('./routes/admin/Users'));
const Suppliers = lazy(() => import('./routes/admin/Suppliers'));
const Settings = lazy(() => import('./routes/admin/Settings'));

// Wrapper components for admin routes with lazy loading
const DashboardPage: Component = () => <AdminLayout><Dashboard /></AdminLayout>;
const InvoicesPage: Component = () => <AdminLayout><Invoices /></AdminLayout>;
const UsersPage: Component = () => (
	<ProtectedRoute adminOnly={true}>
		<AdminLayout><Users /></AdminLayout>
	</ProtectedRoute>
);
const SuppliersPage: Component = () => <AdminLayout><Suppliers /></AdminLayout>;
const SettingsPage: Component = () => <AdminLayout><Settings /></AdminLayout>;

function App() {
	return (
		<>
			<Route path="/" component={Home} />
			<Route path="/login" component={Login} />
			<Route path="/admin" component={DashboardPage} />
			<Route path="/admin/invoices" component={InvoicesPage} />
			<Route path="/admin/users" component={UsersPage} />
			<Route path="/admin/suppliers" component={SuppliersPage} />
			<Route path="/admin/settings" component={SettingsPage} />
		</>
	);
}

export default App;
