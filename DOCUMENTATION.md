# Admin Dashboard - CV. Amlaza Baraka

## 📋 Overview

Admin Dashboard adalah aplikasi web untuk mengelola sistem invoice CV. Amlaza Baraka. Dashboard ini dibangun dengan teknologi modern menggunakan CoreUI design system untuk memberikan pengalaman pengguna yang optimal.

## 🎯 Fitur Utama

### 1. Dashboard

- **Statistik Real-time**: Menampilkan jumlah total invoice, invoice lunas, invoice belum dibayar, dan total pendapatan
- **Navigasi Cepat**: Link langsung ke section invoice, user, dan supplier
- **Responsive Design**: Tampil optimal di desktop, tablet, dan mobile

### 2. Manajemen Invoice

- **Daftar Invoice**: Menampilkan semua invoice dengan informasi lengkap
- **Filter & Pencarian**: Filter berdasarkan status pembayaran, supplier, dan tanggal
- **Mark as Paid/Unpaid**: Toggle status pembayaran dengan tanggal
- **Pagination**: Load more untuk performa optimal
- **Layout Responsive**: 2 kolom di desktop, 1 kolom di mobile/tablet
- **Delete Invoice**: Hapus invoice dengan konfirmasi

### 3. Manajemen User

- **Daftar User**: Menampilkan semua user dengan role dan tanggal pembuatan
- **Tambah User**: Form untuk menambah user baru dengan role admin/user
- **Delete User**: Admin dapat menghapus user lain (tidak bisa hapus diri sendiri)
- **Role Management**: Sistem role-based dengan admin dan user

### 4. Manajemen Supplier

- **Daftar Supplier**: Menampilkan semua supplier
- **Tambah Supplier**: Form untuk menambah supplier baru
- **Pencarian**: Search bar untuk mencari supplier
- **Delete Supplier**: Hapus supplier dengan konfirmasi
- **Responsive Search**: Search bar pindah ke baris sendiri di mobile/tablet

### 5. Settings

- **Profil User**: Menampilkan informasi user saat ini
- **Ubah Password**: Form untuk mengubah password
- **Hapus Akun**: Opsi untuk menghapus akun sendiri
- **Theme Toggle**: Switch antara light dan dark mode

## 🎨 Design System

### CoreUI Integration

- **Icons**: Menggunakan CoreUI Icons untuk konsistensi
- **Color Palette**: Tema warna yang konsisten
- **Typography**: Font dan ukuran yang seragam
- **Components**: Button, card, modal, form yang konsisten

### Responsive Design

- **Mobile First**: Design yang mengutamakan mobile experience
- **Breakpoint**: 768px (tablet), 1024px (desktop)
- **Flexible Layout**: Grid system yang adaptif

### Dark/Light Theme

- **Automatic Detection**: Mendeteksi preferensi system
- **Manual Toggle**: Switch di sidebar untuk mengubah tema
- **Persistent**: Tema tersimpan di localStorage

## 🔧 Technical Features

### Authentication & Authorization

- **JWT Token**: Sistem autentikasi berbasis token
- **Role-based Access**: Admin vs User permissions
- **Secure API**: Semua request menggunakan Authorization header

### API Integration

- **RESTful API**: Komunikasi dengan backend via REST API
- **Error Handling**: Toast notifications untuk feedback
- **Loading States**: Loading spinner untuk UX yang baik

### Performance

- **Lazy Loading**: Load data sesuai kebutuhan
- **Pagination**: Tidak load semua data sekaligus
- **Optimized Rendering**: Efficient DOM manipulation

## 📱 User Interface

### Navigation

- **Sidebar Navigation**: Menu navigasi di samping
- **Mobile Menu**: Hamburger menu untuk mobile
- **Active State**: Highlight menu yang aktif

### Forms

- **Validation**: Client-side validation
- **User Feedback**: Toast messages untuk success/error
- **Modal Dialogs**: Konfirmasi untuk aksi penting

### Data Display

- **Card Layout**: Invoice dan user ditampilkan dalam card
- **Status Badges**: Visual indicator untuk status
- **Action Buttons**: Tombol aksi yang jelas dan konsisten

## 🔒 Security Features

### User Permissions

- **Admin Only**: Delete user, manage system settings
- **Self Protection**: User tidak bisa hapus akun sendiri
- **Role Validation**: Server-side validation untuk permissions

### Data Protection

- **Input Sanitization**: Validasi input di client dan server
- **CSRF Protection**: Token-based request validation
- **Secure Storage**: JWT token di localStorage dengan expiry

## 📊 Data Management

### Invoice Management

- **CRUD Operations**: Create, Read, Update, Delete
- **Status Tracking**: Paid/Unpaid dengan tanggal
- **Search & Filter**: Multiple filter options
- **Bulk Operations**: Efficient data handling

### User Management

- **User Lifecycle**: Create, view, delete users
- **Role Assignment**: Admin/User role management
- **Profile Management**: Password change, account deletion

### Supplier Management

- **Supplier Database**: Centralized supplier data
- **Search Functionality**: Quick supplier lookup
- **Data Integrity**: Validation dan error handling

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection untuk API calls
- Backend server running on port 3001

### Installation

1. Clone repository
2. Open `admin-frontend/admin.html` in browser
3. Login dengan kredensial admin

### Usage

1. **Login**: Masukkan username dan password
2. **Navigate**: Gunakan sidebar untuk berpindah section
3. **Manage Data**: Gunakan form dan button untuk CRUD operations
4. **Settings**: Ubah password atau tema di settings

## 🐛 Troubleshooting

### Common Issues

- **Login Failed**: Periksa kredensial dan koneksi backend
- **Data Not Loading**: Check network connection dan API endpoint
- **UI Not Responsive**: Clear browser cache atau hard refresh

### Error Messages

- **Toast Notifications**: Semua error ditampilkan via toast
- **Console Logs**: Debug info tersedia di browser console
- **Network Tab**: Check API request/response di dev tools

## 🔄 API Endpoints

### Authentication

- `POST /auth/login` - Login user
- `POST /auth/register` - Register new user
- `POST /auth/change-password` - Change password
- `DELETE /auth/delete-account` - Delete account
- `GET /auth/users` - Get all users (admin only)
- `DELETE /auth/users/{username}` - Delete user (admin only)

### Invoice Management

- `GET /invoices` - Get invoices with pagination
- `PATCH /invoices/{id}` - Update invoice status
- `DELETE /invoices/{id}` - Delete invoice

### Supplier Management

- `GET /supplierList` - Get all suppliers
- `POST /supplierList` - Add new supplier
- `DELETE /supplierList/{name}` - Delete supplier

## 📈 Future Enhancements

### Planned Features

- **Export Data**: CSV/PDF export untuk reports
- **Advanced Filters**: Date range, amount filters
- **Bulk Actions**: Select multiple items untuk bulk operations
- **Audit Logs**: Track user actions untuk compliance
- **Email Notifications**: Automated notifications untuk status changes

### Performance Improvements

- **Caching**: Client-side caching untuk faster loading
- **Progressive Web App**: Offline capability
- **Real-time Updates**: WebSocket untuk live data updates

## 🤝 Contributing

### Code Standards

- **ES6+**: Modern JavaScript features
- **CSS Variables**: Consistent theming system
- **Semantic HTML**: Accessible markup
- **Responsive Design**: Mobile-first approach

### Development Guidelines

- **Modular Code**: Separated concerns
- **Error Handling**: Comprehensive error management
- **User Experience**: Intuitive interface design
- **Performance**: Optimized for speed and efficiency

## 📄 License

This project is proprietary software for CV. Amlaza Baraka.

## 📞 Support

For technical support or feature requests, please contact the development team.

---

**Version**: 1.0.0
**Last Updated**: November 16, 2025
**Framework**: Vanilla JavaScript + CSS
**UI Library**: CoreUI v5
