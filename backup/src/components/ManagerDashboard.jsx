import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, isAfter } from 'date-fns';
import { LogOut, DollarSign, Calendar, Info, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManagerDashboard() {
    const { users, logout, calculateSalary, addUser, updateUser, deleteUser, ROLES, advances } = useApp();
    const [viewDate, setViewDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('salary'); // 'salary' | 'employees'

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', role: 'server', customRate: '' });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const employees = users.filter(u => u.role !== 'manager');

    const salaryData = employees.map(u => {
        const calc = calculateSalary(u.id, year, month);
        return { user: u, ...calc };
    });

    const totalPayout = salaryData.reduce((acc, curr) => acc + (curr.finalPayout || 0), 0);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        const rawRate = formData.customRate ? Number(formData.customRate) : undefined;
        const safeRate = (rawRate !== undefined && !isNaN(rawRate)) ? rawRate : undefined;

        addUser({
            name: formData.name,
            role: formData.role,
            customRate: safeRate
        });
        setIsAdding(false);
        setFormData({ name: '', role: 'server', customRate: '' });
    };

    const handleEditSubmit = (id) => {
        const rawRate = formData.customRate ? Number(formData.customRate) : undefined;
        const safeRate = (rawRate !== undefined && !isNaN(rawRate)) ? rawRate : undefined;

        updateUser(id, {
            name: formData.name,
            role: formData.role,
            customRate: safeRate
        });
        setEditingId(null);
        setFormData({ name: '', role: 'server', customRate: '' });
    };

    const startEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            role: user.role,
            customRate: user.customRate || ''
        });
    };

    // Advance Details Modal State
    const [viewingAdvance, setViewingAdvance] = useState(null); // { userName: string, advances: [] }

    const openAdvanceDetails = (user, monthData) => {
        // Filter advances for this specific month/year
        const userAdvances = advances[user.id] || [];
        const monthAdvances = userAdvances.filter(adv => {
            const d = new Date(adv.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        setViewingAdvance({
            userName: user.name,
            data: monthAdvances
        });
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Advance Details Modal */}
            <AnimatePresence>
                {viewingAdvance && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setViewingAdvance(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold text-white mb-1">Chi tiết Ứng Lương</h3>
                            <p className="text-slate-400 text-sm mb-6">Nhân viên: <span className="text-emerald-400 font-medium">{viewingAdvance.userName}</span></p>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {viewingAdvance.data.length === 0 ? (
                                    <p className="text-slate-500 text-center italic py-4">Chưa có khoản ứng nào trong tháng này.</p>
                                ) : (
                                    viewingAdvance.data.map((adv, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-slate-300 text-sm font-medium">
                                                    {format(new Date(adv.date), 'dd/MM/yyyy')}
                                                </span>
                                                <span className="text-slate-500 text-xs">
                                                    {format(new Date(adv.date), 'HH:mm')}
                                                </span>
                                            </div>
                                            <span className="text-orange-400 font-mono-numbers font-bold">
                                                -{formatMoney(adv.amount)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Tổng cộng</span>
                                <span className="text-xl font-bold text-orange-400 font-mono-numbers">
                                    {formatMoney(viewingAdvance.data.reduce((sum, item) => sum + item.amount, 0))}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4 mb-8 relative z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Dashboard Quản Lý
                        </span>
                    </h2>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-800/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('salary')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'salary' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Bảng Lương
                    </button>
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'employees' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Nhân Viên
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                        >
                            &larr;
                        </button>
                        <div className="px-2 font-medium min-w-[100px] text-center">
                            {format(viewDate, 'MM/yyyy')}
                        </div>
                        <button
                            onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                        >
                            &rarr;
                        </button>
                    </div>

                    <button onClick={logout} className="glass-button text-sm">
                        <LogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {activeTab === 'salary' ? (
                <div className="space-y-8 fade-in">
                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Nhân Viên</th>
                                        <th>Vị Trí</th>
                                        <th className="text-right">Công</th>
                                        <th className="text-right">Off</th>
                                        <th className="text-right">Thưởng</th>
                                        <th className="text-right">Tổng Lương</th>
                                        <th className="text-right text-orange-400">Đã Ứng</th>
                                        <th className="text-right text-emerald-400">Thực Nhận</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaryData.map((data) => {
                                        const user = data.user;
                                        const salary = data.totalSalary;

                                        return (
                                            <tr key={user.id} className="transition-colors hover:bg-white/5">
                                                <td className="font-medium text-white">{user.name}</td>
                                                <td>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'manager' ? 'bg-purple-400/10 text-purple-400' :
                                                        user.role === 'bartender' ? 'bg-purple-400/10 text-purple-400' :
                                                            'bg-pink-400/10 text-pink-400'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="text-right font-mono-numbers text-white">{data.workedDays}</td>
                                                <td className="text-right font-mono-numbers text-slate-400">{data.offDaysTaken}</td>
                                                <td className="text-right font-mono-numbers text-emerald-400">+{data.bonusDays}</td>
                                                <td className="text-right font-medium font-mono-numbers text-slate-300">
                                                    {formatMoney(salary)}
                                                </td>
                                                <td className="text-right">
                                                    {data.totalAdvanced > 0 ? (
                                                        <button
                                                            onClick={() => openAdvanceDetails(user, data)}
                                                            className="text-orange-400 font-bold font-mono-numbers hover:underline decoration-orange-400/50 underline-offset-4"
                                                            title="Xem chi tiết"
                                                        >
                                                            -{formatMoney(data.totalAdvanced)}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-600 font-mono-numbers">-</span>
                                                    )}
                                                </td>
                                                <td className="text-right font-bold font-mono-numbers text-emerald-400 text-lg">
                                                    {formatMoney(data.finalPayout)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 fade-in">
                    {/* Add User Button */}
                    {!isAdding && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsAdding(true)}
                                className="glass-button primary"
                            >
                                <Plus size={18} />
                                Thêm Nhân Viên
                            </button>
                        </div>
                    )}

                    {/* Add User Form */}
                    <AnimatePresence>
                        {isAdding && (
                            <motion.form
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                onSubmit={handleAddSubmit}
                                className="glass-card mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-emerald-500/5 border-emerald-500/20"
                            >
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và Tên</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Nhập tên nhân viên..."
                                        className="glass-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vị trí</label>
                                    <select
                                        className="glass-input appearance-none cursor-pointer"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="server">Phục Vụ</option>
                                        <option value="bartender">Pha Chế</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="glass-button primary flex-1">Lưu</button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="glass-button"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Employee List */}
                    <div className="glass-panel overflow-hidden">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Nhân viên</th>
                                    <th>Vị trí</th>
                                    <th>Lương cơ bản (Tuỳ chỉnh)</th>
                                    <th className="text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(u => (
                                    <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="font-medium">
                                            {editingId === u.id ? (
                                                <input
                                                    type="text"
                                                    className="glass-input py-1 px-2 text-sm"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                        ${u.role === 'bartender' ? 'bg-purple-500 text-white' : 'bg-pink-500 text-white'}`}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <span className="text-white">{u.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {editingId === u.id ? (
                                                <select
                                                    className="glass-input py-1 px-2 text-sm"
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                >
                                                    <option value="server">Phục Vụ</option>
                                                    <option value="bartender">Pha Chế</option>
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'bartender' ? 'bg-purple-400/10 text-purple-400' : 'bg-pink-400/10 text-pink-400'
                                                    }`}>
                                                    {u.role === 'bartender' ? 'Pha Chế' : 'Phục Vụ'}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {editingId === u.id ? (
                                                <input
                                                    type="number"
                                                    className="glass-input py-1 px-2 text-sm w-32"
                                                    placeholder="Mặc định"
                                                    value={formData.customRate}
                                                    onChange={e => setFormData({ ...formData, customRate: e.target.value })}
                                                />
                                            ) : (
                                                <span className="text-slate-400 font-mono-numbers">
                                                    {u.customRate ? formatMoney(u.customRate) : (
                                                        <span className="opacity-50 italic">Mặc định</span>
                                                    )}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            {editingId === u.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditSubmit(u.id)}
                                                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-2 bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => startEdit(u)}
                                                        className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Bạn có chắc muốn xóa nhân viên này?')) deleteUser(u.id)
                                                        }}
                                                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {employees.length === 0 && (
                            <div className="p-8 text-center text-slate-500 italic">
                                Chưa có nhân viên nào. Hãy thêm nhân viên mới!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
}
