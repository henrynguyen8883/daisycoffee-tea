import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Save, AlertCircle } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const { currentUser, updateUser } = useApp();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!currentUser) return;

        if (currentUser.password && oldPassword !== currentUser.password) {
            setError('Mật khẩu cũ không chính xác.');
            return;
        }

        if (newPassword.length < 3) {
            setError('Mật khẩu mới phải có ít nhất 3 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới không khớp.');
            return;
        }

        // Update
        updateUser(currentUser.id, { password: newPassword });
        setSuccess(' thành công!');

        // Reset form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Close after 1.5s
        setTimeout(() => {
            onClose();
            setSuccess('');
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white"></h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mật khẩu cũ</label>
                                <input
                                    type="password"
                                    required
                                    className="glass-input w-full"
                                    placeholder="••••••"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    required
                                    className="glass-input w-full"
                                    placeholder="••••••"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    required
                                    className="glass-input w-full"
                                    placeholder="••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-rose-400 text-sm flex items-center gap-2 overflow-hidden"
                                    >
                                        <AlertCircle size={14} />
                                        {error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-emerald-400 text-sm font-bold text-center overflow-hidden"
                                    >
                                        {success}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                className="w-full glass-button primary mt-2 justify-center"
                            >
                                <Save size={18} />
                                Lưu Thay Đổi
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
