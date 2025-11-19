import { Component, JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../stores/authStore';

interface ProtectedRouteProps {
    children: JSX.Element;
    adminOnly?: boolean;
}

const ProtectedRoute: Component<ProtectedRouteProps> = (props) => {
    const { authState } = useAuth();
    const navigate = useNavigate();

    // Check if user is admin when adminOnly is true
    const hasAccess = () => {
        if (!props.adminOnly) return true;
        return authState.user?.role === 'admin';
    };

    // Redirect if no access
    if (props.adminOnly && !hasAccess()) {
        navigate('/admin', { replace: true });
        return (
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Akses Ditolak
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        Anda tidak memiliki akses ke halaman ini.
                    </p>
                </div>
            </div>
        );
    }

    return <>{props.children}</>;
};

export default ProtectedRoute;
