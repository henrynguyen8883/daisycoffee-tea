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
    const [newMat, setNewMat] = useState({ name: '', unit: 'g', price_per_unit: '' });

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
    const totalCost = reportData.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const groupedByDate = reportData.reduce((acc, item) => {
        const dateKey = item.date;
        if (!acc[dateKey]) acc[dateKey] = { items: [], total: 0 };
        acc[dateKey].items.push(item);
        acc[dateKey].total += (item.total_price || 0);
        return acc;
    }, {});
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

    // --- LOGIC: CATALOG ---
    const [editingId, setEditingId] = useState(null);

    const handleEdit = (material) => {
        setNewMat({
            name: material.name,
            unit: material.unit,
            price_per_unit: material.price_per_unit,
            base_amount: material.base_amount || 1
        });
        setEditingId(material.id);
        setIsAddingMat(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa nguyên liệu này không?')) return;
        try {
            await api.deleteMaterial(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Lỗi khi xóa nguyên liệu');
        }
    };

    const handleSaveMaterial = async (e) => {
        e.preventDefault();
        try {
            const materialData = {
                ...newMat,
                price_per_unit: parseFloat(newMat.price_per_unit),
                base_amount: parseFloat(newMat.base_amount || 1)
            };

            if (editingId) {
                await api.updateMaterial(editingId, materialData);
                alert('Cập nhật thành công!');
            } else {
                await api.addMaterial(materialData);
                alert('Thêm mới thành công!');
            }

            setIsAddingMat(false);
            setNewMat({ name: '', unit: 'g', price_per_unit: '', base_amount: '' });
            setEditingId(null);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Lỗi khi lưu nguyên liệu');
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
                                                            {(item.total_price || 0).toLocaleString()}đ
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
                        <button onClick={() => {
                            setIsAddingMat(true);
                            setEditingId(null);
                            setNewMat({ name: '', unit: 'g', price_per_unit: '', base_amount: '' });
                        }} className="glass-button primary">
                            <Plus size={18} /> Thêm Mới
                        </button>
                    </div>

                    {/* Add Form */}
                    {isAddingMat && (
                        <form onSubmit={handleSaveMaterial} className="glass-panel p-6 border border-amber-500/30 bg-amber-900/10">
                            <h4 className="font-bold text-amber-400 mb-4 uppercase text-xs tracking-wider">
                                {editingId ? 'Cập Nhật Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400">Tên Nguyên Liệu</label>
                                    <input required type="text" className="glass-input" placeholder="VD: Matcha Nhật Bản" value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">Đơn vị tính</label>
                                    <select className="glass-input" value={newMat.unit} onChange={e => setNewMat({ ...newMat, unit: e.target.value })}>
                                        <option value="g">Gam (g)</option>
                                        <option value="ml">Mililit (ml)</option>
                                        <option value="bich">Bịch</option>
                                        <option value="hop">Hộp</option>
                                        <option value="chai">Chai</option>
                                        <option value="cai">Cái</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">Quy cách (nếu có)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="glass-input pr-8"
                                            placeholder="VD: 500"
                                            value={newMat.base_amount || ''}
                                            onChange={e => setNewMat({ ...newMat, base_amount: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs text-right">
                                            (g/ml)
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">
                                        Giá Nhập
                                    </label>
                                    <input required type="number" className="glass-input" placeholder="VNĐ" value={newMat.price_per_unit} onChange={e => setNewMat({ ...newMat, price_per_unit: e.target.value })} />
                                </div>
                            </div>

                            {/* Callout Info: Unit Price Calculation */}
                            {newMat.price_per_unit && newMat.base_amount > 1 && (
                                <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400 flex items-center gap-2">
                                    <span>👉 Giá trung bình:</span>
                                    <span className="font-bold font-mono">
                                        {(newMat.price_per_unit / newMat.base_amount).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} đ
                                    </span>
                                    <span>/ 1 g (ml)</span>
                                </div>
                            )}
                            <div className="mt-4 flex gap-3">
                                <button type="submit" className="glass-button primary">
                                    {editingId ? 'Cập Nhật' : 'Lưu Nguyên Liệu'}
                                </button>
                                <button type="button" onClick={() => {
                                    setIsAddingMat(false);
                                    setEditingId(null);
                                    setNewMat({ name: '', unit: 'g', price_per_unit: '', base_amount: '' });
                                }} className="glass-button">Hủy</button>
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
                                    <th className="p-3 text-right font-bold text-amber-500">Giá Nhập</th>
                                    <th className="p-3 text-right pr-6">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {materials.map(m => {
                                    const baseAmount = m.base_amount || 1;
                                    const unitPrice = m.price_per_unit / baseAmount;

                                    return (
                                        <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-3 pl-6 font-mono text-xs">{m.id}</td>
                                            <td className="p-3 font-medium text-white">
                                                {m.name}
                                                {baseAmount > 1 && (
                                                    <div className="text-xs text-slate-500 font-normal mt-0.5">
                                                        Quy đổi: {unitPrice.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}đ / 1{m.unit}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">
                                                    {m.unit}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-bold text-amber-400 font-mono-numbers">
                                                {m.price_per_unit ? m.price_per_unit.toLocaleString() : 0} ₫
                                                {baseAmount > 1 && (
                                                    <span className="text-xs text-slate-500 font-normal ml-1">
                                                        / {baseAmount} {m.unit}
                                                    </span>
                                                )}
                                                {baseAmount <= 1 && (
                                                    <span className="text-xs text-slate-500 font-normal ml-1">
                                                        / {m.unit}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right pr-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(m)}
                                                        className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 rounded transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Settings size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m.id)}
                                                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            )}
        </div>
    );
}
