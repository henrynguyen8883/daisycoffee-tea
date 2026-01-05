import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { vi } from 'date-fns/locale';
import clsx from 'clsx';

export default function EmployeeDashboard() {
    const { currentUser, logout, attendance, updateAttendance } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());

    const userAttendance = attendance[currentUser.id] || {};

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const handleDayClick = (date) => {
        // Prevent future dates
        if (date > new Date()) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        const currentStatus = userAttendance[dateStr];

        // Toggle: null -> WORKED -> OFF -> null
        let nextStatus = 'WORKED';
        if (currentStatus === 'WORKED') nextStatus = 'OFF';
        else if (currentStatus === 'OFF') nextStatus = null;

        updateAttendance(currentUser.id, dateStr, nextStatus);
    };

    const getDayStatus = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return userAttendance[dateStr];
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="text-slate-400 font-medium uppercase tracking-widest text-xs mb-2">Welcome Back</p>
                    <h2 className="heading-xl">
                        {currentUser.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentUser.role === 'bartender' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            }`}>
                            {currentUser.role}
                        </span>
                        <span className="text-slate-500 text-sm">•</span>
                        <span className="text-slate-400 text-sm">Timekeeping Dashboard</span>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="glass-button text-sm hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300"
                >
                    Sign Out
                </button>
            </div>

            {/* Main Content */}
            <div className="glass-panel p-1">
                {/* Control Bar */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5">
                    <div className="flex items-center gap-4 bg-slate-900/40 rounded-full p-1.5 border border-white/5">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            ←
                        </button>
                        <span className="font-mono-numbers text-lg font-bold min-w-[120px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            →
                        </button>
                    </div>

                    <div className="flex gap-6 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                            <span className="text-slate-300">Worked</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]"></span>
                            <span className="text-slate-300">Off Day</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-7 gap-4 mb-4">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-500 tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-3 md:gap-4">
                        {calendarDays.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const status = getDayStatus(day);
                            const isToday = isSameDay(day, new Date());
                            const isFuture = day > new Date();

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={clsx(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border relative group select-none overflow-hidden",
                                        !isCurrentMonth && "opacity-20 grayscale",
                                        isFuture ? "opacity-30 cursor-not-allowed bg-slate-900/50" : "cursor-pointer",
                                        isCurrentMonth && !isFuture && "hover:scale-105 hover:z-10",
                                        !status && !isFuture && "bg-slate-800/20 border-white/5 hover:bg-slate-700/30 text-slate-400",
                                        status === 'WORKED' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]",
                                        status === 'OFF' && "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]",
                                        isToday && isCurrentMonth && !status && "ring-1 ring-primary/50 bg-primary/5"
                                    )}
                                >
                                    {status === 'WORKED' && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}

                                    <span className={clsx(
                                        "text-xl font-mono-numbers relative z-10",
                                        status ? "font-bold" : "font-medium"
                                    )}>{format(day, 'd')}</span>

                                    {status === 'WORKED' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>}
                                    {status === 'OFF' && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-900/30 border-t border-white/5 p-4 flex justify-center text-xs text-slate-500 tracking-wide">
                    Tap a day to toggle status • 1x: Worked • 2x: Off • 3x: Clear
                </div>
            </div>

            {/* Salary Advance Section */}
            <SalaryAdvanceSection currentUser={currentUser} currentDate={currentDate} />
        </div>
    );
}

function SalaryAdvanceSection({ currentUser, currentDate }) {
    const { calculateSalary, addAdvance } = useApp();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const salaryData = calculateSalary(currentUser.id, year, month);

    // If no data (e.g. manager view or error), don't render
    if (!salaryData) return null;

    const { maxAdvanceLimit, totalAdvanced, remainingAdvanceLimit } = salaryData;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const val = Number(amount);
        if (!val || val <= 0) {
            setError('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        if (val > remainingAdvanceLimit) {
            setError(`Số tiền vượt quá hạn mức cho phép (${remainingAdvanceLimit.toLocaleString('vi-VN')} ₫)`);
            return;
        }

        addAdvance(currentUser.id, val);
        setSuccess('Đã ứng lương thành công!');
        setAmount('');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
    };

    return (
        <div className="glass-panel p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-emerald-400">$</span> Ứng Lương
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Hạn mức tối đa (70%)</div>
                    <div className="text-2xl font-mono-numbers text-white font-bold">
                        {maxAdvanceLimit.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                        Dựa trên {salaryData.workedDays} ngày làm việc
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Đã ứng</div>
                    <div className="text-2xl font-mono-numbers text-orange-400 font-bold">
                        {totalAdvanced.toLocaleString('vi-VN')} ₫
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <DollarSign size={48} className="text-emerald-400" />
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Có thể ứng thêm</div>
                    <div className="text-2xl font-mono-numbers text-emerald-400 font-bold">
                        {remainingAdvanceLimit.toLocaleString('vi-VN')} ₫
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-md">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nhập số tiền muốn ứng
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ví dụ: 500000"
                            className="glass-input pr-12 font-mono-numbers"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">VND</div>
                    </div>
                    {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
                    {success && <p className="text-emerald-400 text-sm mt-2">{success}</p>}
                </div>

                <button
                    type="submit"
                    disabled={remainingAdvanceLimit <= 0}
                    className={`glass-button w-full ${remainingAdvanceLimit > 0 ? 'primary' : 'opacity-50 cursor-not-allowed'}`}
                >
                    Xác Nhận Ứng Lương
                </button>
            </form>
        </div>
    );
}
