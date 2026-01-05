import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, UserCircle2, ArrowRight } from 'lucide-react';

export default function Login() {
    const { users, login } = useApp();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        const success = login(selectedUserId, password);
        if (!success) {
            setError('Đăng nhập thất bại. Kiểm tra lại mật khẩu nếu là Quản Lý.');
        }
    };

    const selectedUser = users.find(u => u.id === selectedUserId);
    const isManager = selectedUser?.role === 'manager';

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
            {/* Desktop Left Side - Brand / Visuals */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-slate-900 to-slate-900 z-0" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />

                {/* Decorative Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]" />

                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Daisy Coffee & Tea</h1>
                    <p className="text-slate-400 mt-2 text-lg">Quản lý chấm công.</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <blockquote className="text-xl text-slate-300 font-medium leading-relaxed">
                        "Hệ thống giúp chúng tôi tiết kiệm thời gian và minh bạch trong việc chấm công cho nhân viên."
                    </blockquote>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">MK</div>
                        <div>
                            <div className="text-white font-bold">Thanh Sơn</div>
                            <div className="text-slate-500 text-sm">Website Manager</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-slate-500 text-sm">
                    © 2024 Daisy Coffee & Tea. All rights reserved.
                </div>
            </div>

            {/* Right Side / Mobile Full - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
                {/* Mobile Background Elements */}
                <div className="absolute inset-0 bg-slate-950 lg:hidden" />
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-violet-900/20 to-transparent lg:hidden pointer-events-none" />

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="text-center lg:text-left">
                        <div className="inline-block lg:hidden mb-4 rounded-xl bg-slate-900/50 p-3 border border-white/5 backdrop-blur-md">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">TimeKeeping</h1>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Chào mừng trở lại</h2>
                        <p className="mt-2 text-slate-400">Vui lòng đăng nhập để tiếp tục chấm công.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 block">Chọn Nhân Viên</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCircle2 className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                </div>
                                <select
                                    className="block w-full rounded-xl border-0 bg-slate-900/80 py-3.5 pl-10 pr-4 text-slate-200 ring-1 ring-inset ring-slate-800 focus:ring-2 focus:ring-inset focus:ring-violet-500 sm:text-sm sm:leading-6 transition-all appearance-none cursor-pointer hover:bg-slate-900"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Chọn tài khoản --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} {u.role === 'manager' ? '👑' : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 block">Mật khẩu</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    className="block w-full rounded-xl border-0 bg-slate-900/80 py-3.5 pl-10 text-slate-200 ring-1 ring-inset ring-slate-800 focus:ring-2 focus:ring-inset focus:ring-violet-500 sm:text-sm sm:leading-6 transition-all placeholder:text-slate-600"
                                    placeholder="Nhập mật khẩu..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedUserId}
                            className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                        >
                            Đăng Nhập
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>
                </div >
            </div >

            {/* Import framer-motion here since we use AnimatePresence inside */}
        </div >
    );
}

// Add necessary imports if missing at the top of the file
import { motion, AnimatePresence } from 'framer-motion';
