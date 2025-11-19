import { Component, createSignal, Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useAuth } from '../stores/authStore';
import { useTheme } from '../stores/themeStore';
import {
    BsSpeedometer2,
    BsFileEarmarkText,
    BsPeopleFill,
    BsBuilding,
    BsGearFill,
    BsXLg,
    BsBoxArrowRight,
    BsMoonStarsFill,
    BsSunFill,
    BsShieldCheck,
    BsExclamationTriangle
} from 'solid-icons/bs';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: Component<SidebarProps> = (props) => {
    const location = useLocation();
    const { authState, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    // Local state for logout confirmation
    const [showLogoutConfirm, setShowLogoutConfirm] = createSignal(false);

    const allNavItems = [
        { path: '/admin', label: 'Dashboard', icon: BsSpeedometer2, adminOnly: false },
        { path: '/admin/invoices', label: 'Invoice', icon: BsFileEarmarkText, adminOnly: false },
        { path: '/admin/users', label: 'Pengguna', icon: BsPeopleFill, adminOnly: true },
        { path: '/admin/suppliers', label: 'Supplier', icon: BsBuilding, adminOnly: false },
        { path: '/admin/settings', label: 'Pengaturan', icon: BsGearFill, adminOnly: false },
    ];

    // Filter nav items based on user role
    const navItems = () => {
        const isAdmin = authState.user?.role === 'admin';
        return allNavItems.filter(item => !item.adminOnly || isAdmin);
    };

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = () => {
        setShowLogoutConfirm(false);
        logout();
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                class={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${props.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={props.onClose}
            />

            {/* Sidebar */}
            <aside
                class={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ${props.isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:static`}
            >
                {/* Header */}
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h2>
                    <button
                        onClick={props.onClose}
                        class="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                        <BsXLg size={18} />
                    </button>
                </div>

                {/* User Profile */}
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
                    <div class="flex items-start gap-3">
                        {/* Avatar */}
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {authState.user?.username.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* User Info */}
                        <div class="flex-1 min-w-0">
                            <div class="font-semibold text-gray-900 dark:text-white truncate">
                                {authState.user?.username}
                            </div>

                            {/* Role Badge */}
                            <div class="mt-1.5">
                                {authState.user?.role === 'admin' ? (
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                        <BsShieldCheck class="w-3 h-3" />
                                        Administrator
                                    </span>
                                ) : (
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        <BsPeopleFill class="w-3 h-3" />
                                        User
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav class="p-4 flex-1">
                    <ul class="space-y-2">
                        {navItems().map((item) => (
                            <li>
                                <A
                                    href={item.path}
                                    class={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={props.onClose}
                                >
                                    <item.icon size={20} />
                                    <span class="font-medium">{item.label}</span>
                                </A>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {/* Theme Toggle */}
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-700 dark:text-gray-300">Mode Gelap</span>
                        <button
                            onClick={toggleTheme}
                            class={`p-2 rounded-lg transition-colors ${isDark()
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {isDark() ? <BsMoonStarsFill size={16} /> : <BsSunFill size={16} />}
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogoutClick}
                        class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                        <BsBoxArrowRight size={18} />
                        <span>Keluar</span>
                    </button>
                </div>

            </aside>

            {/* Logout Confirmation Modal - Outside sidebar for full screen overlay */}
            <Show when={showLogoutConfirm()}>
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <BsExclamationTriangle class="text-yellow-600 dark:text-yellow-500" size={24} />
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Konfirmasi Keluar
                            </h3>
                        </div>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">
                            Apakah Anda yakin ingin keluar dari aplikasi?
                        </p>
                        <div class="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </>
    );
};

export default Sidebar;
