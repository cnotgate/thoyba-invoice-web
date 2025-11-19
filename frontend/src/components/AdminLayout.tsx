import { Component, createSignal, JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../stores/authStore';
import Sidebar from './Sidebar';
import { BsList } from 'solid-icons/bs';

interface AdminLayoutProps {
    children: JSX.Element;
}

const AdminLayout: Component<AdminLayoutProps> = (props) => {
    const [sidebarOpen, setSidebarOpen] = createSignal(false);
    const navigate = useNavigate();
    const { authState } = useAuth();

    // Protect route - redirect if not authenticated
    if (!authState.isAuthenticated) {
        navigate('/login', { replace: true });
        return null;
    }

    return (
        <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen()} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div class="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen())}
                        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                        <BsList size={24} />
                    </button>
                    <h1 class="text-lg font-bold text-gray-800 dark:text-white">CV. Amlaza Baraka</h1>
                    <div class="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Page Content */}
                <main class="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {props.children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
