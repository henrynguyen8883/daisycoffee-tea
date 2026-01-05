import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Filter, FileText, Calendar, Settings, Plus, Save, X, Package } from 'lucide-react';

export default function MaterialsDashboard() {
    const [activeView, setActiveView] = useState('report'); // 'report' | 'catalog'
    const [reportData, setReportData] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    // Material Form State (For Adding New Materials)
    const [isAddingMat, setIsAddingMat] = useState(false);
    const [newMat, setNewMat] = useState({ name: '', base_unit: 'g', base_amount: '1000', base_price: '' });

    useEffect(() => {
        loadData();
    }, [activeView]); // Reload when switching views

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeView === 'report') {
                const res = await api.getReports(startDate, endDate);
                if (res.data) setReportData(res.data);
            } else {
                const res = await api.getMaterials();
                if (res.data) setMaterials(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC: REPORT ---
    const totalCost = reportData.reduce((sum, item) => sum + item.total_price, 0);
    const groupedByDate = reportData.reduce((acc, item) => {
        const dateKey = item.date;
        if (!acc[dateKey]) acc[dateKey] = { items: [], total: 0 };
        acc[dateKey].items.push(item);
        acc[dateKey].total += item.total_price;
        return acc;
    }, {});
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

    // --- LOGIC: CATALOG ---
    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            await api.addMaterial({
                ...newMat,
                base_amount: parseFloat(newMat.base_amount),
                base_price: parseFloat(newMat.base_price)
            });
            alert('Thêm nguyên liệu thành công!');
            setIsAddingMat(false);
            setNewMat({ name: '', base_unit: 'g', base_amount: '1000', base_price: '' });
            loadData(); // Refresh list
        } catch (error) {
            alert('Lỗi khi thêm nguyên liệu');
        }
    };

    return (
        <div className="space-y-6 fade-in text-white">
            {/* Sub-Navigation for Dashboard */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveView('report')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeView === 'report' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <FileText size={18} /> Báo Cáo Nhập Kho
                </button>
                <button
                    onClick={() => setActiveView('catalog')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeView === 'catalog' ? 'bg-amber-500 text-white font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <Settings size={18} /> Quản Lý Danh Mục
                </button>
            </div>

            {/* === VIEW: REPORT === */}
            {activeView === 'report' && (
                <div className="space-y-6">
                    {/* Stats & Filter */}
                    <div className="glass-panel p-4 flex flex-col md:flex-row items-end justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Từ ngày</label>
                                <input type="date" className="glass-input py-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Đến ngày</label>
                                <input type="date" className="glass-input py-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <button onClick={loadData} className="glass-button primary h-[42px] px-4 mb-0.5"><Filter size={16} /> Lọc</button>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Chi Phí</div>
                            <div className="text-2xl font-bold text-emerald-400 font-mono-numbers">{totalCost.toLocaleString('vi-VN')} ₫</div>
                        </div>
                    </div>

                    {/* Report List */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center py-12 text-slate-500">Đang tải dữ liệu...</div>
                        ) : sortedDates.length === 0 ? (
                            <div className="glass-panel p-12 text-center border-dashed border-2 border-slate-700">
                                <p className="text-slate-400 text-lg mb-2">Chưa có dữ liệu nhập kho.</p>
                                <p className="text-slate-500 text-sm">Hãy chắc chắn rằng Nhân viên đã nhập liệu và bạn đã chọn đúng khoảng thời gian.</p>
                            </div>
                        ) : (
                            sortedDates.map(dateKey => {
                                const { items, total } = groupedByDate[dateKey];
                                return (
                                    <div key={dateKey} className="glass-panel overflow-hidden border border-white/5">
                                        <div className="bg-slate-800/50 p-3 border-b border-white/5 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-emerald-400" />
                                                <span className="font-bold text-slate-200">{format(parseISO(dateKey), 'dd/MM/yyyy')}</span>
                                            </div>
                                            <div className="text-sm">
                                                Tổng ngày: <span className="font-bold text-emerald-400 font-mono-numbers text-lg ml-2">{total.toLocaleString('vi-VN')} ₫</span>
                                            </div>
                                        </div>
                                        <table className="w-full text-left text-sm text-slate-400">
                                            <thead className="bg-slate-900/30 text-xs uppercase font-bold text-slate-500">
                                                <tr>
                                                    <th className="p-3 pl-4">Nguyên Liệu</th>
                                                    <th className="p-3 text-right">SL Nhập</th>
                                                    <th className="p-3 text-right">Khối Lượng</th>
                                                    <th className="p-3 text-right pr-4">Thành Tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {items.map(item => (
                                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 pl-4 font-medium text-white">{item.material_name}</td>
                                                        <td className="p-3 text-right font-mono-numbers">
                                                            {item.quantity ? <span className="text-emerald-300">{item.quantity} {item.base_unit}</span> : '-'}
                                                        </td>
                                                        <td className="p-3 text-right font-mono-numbers">
                                                            {item.weight ? <span className="text-blue-300">{item.weight} g/ml</span> : '-'}
                                                        </td>
                                                        <td className="p-3 text-right pr-4 font-bold font-mono-numbers text-emerald-400">
                                                            {item.total_price.toLocaleString()}đ
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* === VIEW: CATALOG === */}
            {activeView === 'catalog' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-200">Danh Mục Nguyên Liệu & Giá</h3>
                        <button onClick={() => setIsAddingMat(true)} className="glass-button primary">
                            <Plus size={18} /> Thêm Mới
                        </button>
                    </div>

                    {/* Add Form */}
                    {isAddingMat && (
                        <form onSubmit={handleAddMaterial} className="glass-panel p-6 border border-amber-500/30 bg-amber-900/10">
                            <h4 className="font-bold text-amber-400 mb-4 uppercase text-xs tracking-wider">Thêm Nguyên Liệu Mới</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400">Tên Nguyên Liệu</label>
                                    <input required type="text" className="glass-input" placeholder="VD: Matcha Nhật Bản" value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">Đơn vị cơ sở</label>
                                    <select className="glass-input" value={newMat.base_unit} onChange={e => setNewMat({ ...newMat, base_unit: e.target.value })}>
                                        <option value="g">Gam (g)</option>
                                        <option value="ml">Mililit (ml)</option>
                                        <option value="bich">Bịch</option>
                                        <option value="hop">Hộp</option>
                                        <option value="chai">Chai</option>
                                        <option value="cai">Cái</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">
                                        Giá Nhập (cho {newMat.base_amount || 1} {newMat.base_unit})
                                    </label>
                                    <input required type="number" className="glass-input" placeholder="VNĐ" value={newMat.base_price} onChange={e => setNewMat({ ...newMat, base_price: e.target.value })} />
                                </div>
                                <div className="space-y-2 hidden">
                                    {/* Hidden Base Amount, default 1 or 1000 based on logic? 
                                         For simplicity, let user allow 1 unit. 
                                         If Unit is GRAM, Price is usually per 1kg (1000g) or 100g? 
                                         Let's allow user to edit Base Amount if needed, or default it.
                                     */}
                                    <input type="number" value={newMat.base_amount} onChange={e => setNewMat({ ...newMat, base_amount: e.target.value })} />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button type="submit" className="glass-button primary">Lưu Nguyên Liệu</button>
                                <button type="button" onClick={() => setIsAddingMat(false)} className="glass-button">Hủy</button>
                            </div>
                        </form>
                    )}

                    {/* Material List */}
                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-800 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="p-3 pl-6">ID</th>
                                    <th className="p-3">Tên Nguyên Liệu</th>
                                    <th className="p-3 text-right">Đơn vị</th>
                                    <th className="p-3 text-right">Giá Gốc</th>
                                    <th className="p-3 text-right pr-6">Quy đổi chuẩn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {materials.map(m => (
                                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 pl-6 font-mono text-xs">{m.id}</td>
                                        <td className="p-3 font-medium text-white">{m.name}</td>
                                        <td className="p-3 text-right">
                                            <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">{m.base_unit}</span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-amber-400 font-mono-numbers">
                                            {m.base_price.toLocaleString()} ₫
                                        </td>
                                        <td className="p-3 text-right pr-6 text-xs text-slate-500">
                                            / {m.base_amount} {m.base_unit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
