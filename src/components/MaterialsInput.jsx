import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Plus, Save, Package, Search, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function MaterialsInput({ currentUser }) {
    const [materials, setMaterials] = useState([]);
    const [entries, setEntries] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Form Stats
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Combobox State
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const dropdownRef = useRef(null);

    // Inputs
    const [quantity, setQuantity] = useState('');
    const [weight, setWeight] = useState('');

    useEffect(() => {
        loadMaterials();

        // Click outside to close dropdown
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadMaterials = async () => {
        try {
            const res = await api.getMaterials();
            if (res.data) setMaterials(res.data);
        } catch (error) {
            console.error("Failed to load materials", error);
        }
    };

    // Filtered options
    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (material) => {
        setSelectedMaterial(material);
        setSearchTerm(material.name); // Set input to name
        setIsOpen(false);
        // Reset inputs
        setQuantity('');
        setWeight('');
    };

    const handleAddEntry = () => {
        if (!selectedMaterial) return;

        if (!quantity && !weight) {
            alert('Vui lòng nhập Số lượng hoặc Khối lượng!');
            return;
        }

        const newEntry = {
            tempId: Date.now(),
            material: selectedMaterial,
            quantity: quantity ? parseFloat(quantity) : null,
            weight: weight ? parseFloat(weight) : null,
            date
        };

        setEntries([...entries, newEntry]);

        // Reset selection
        setSelectedMaterial(null);
        setSearchTerm('');
        setQuantity('');
        setWeight('');
    };

    const handleSubmit = async () => {
        if (entries.length === 0) return;
        setSubmitting(true);

        try {
            const promises = entries.map(entry =>
                api.logUsage({
                    user_id: currentUser.id,
                    material_id: entry.material.id,
                    date: entry.date,
                    quantity: entry.quantity,
                    weight: entry.weight
                })
            );

            await Promise.all(promises);

            alert('Đã lưu phiếu nhập kho thành công!');
            setEntries([]);

        } catch (error) {
            console.error("Error submitting", error);
            alert('Có lỗi xảy ra khi lưu phiếu.');
        } finally {
            setSubmitting(false);
        }
    };

    const removeEntry = (tempId) => {
        setEntries(entries.filter(e => e.tempId !== tempId));
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="glass-panel p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Package className="text-emerald-400" />
                    Nhập Kho Nguyên Liệu
                </h3>

                {/* Input Form */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-4">
                    {/* Row 1: Date & Material Combobox */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Ngày nhập</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 lg:col-span-3 relative" ref={dropdownRef}>
                            <label className="text-xs font-bold text-slate-400 uppercase">Tìm & Chọn Nguyên Liệu</label>

                            {/* Custom Combobox Input */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Gõ để tìm kiếm..."
                                    className="glass-input pl-9 pr-8"
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setIsOpen(true);
                                        if (selectedMaterial && e.target.value !== selectedMaterial.name) {
                                            setSelectedMaterial(null); // Deselect if user modifies text
                                        }
                                    }}
                                    onFocus={() => setIsOpen(true)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                            {/* Dropdown Options */}
                            {isOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                    {filteredMaterials.length === 0 ? (
                                        <div className="p-3 text-slate-500 text-sm italic text-center">
                                            Không tìm thấy nguyên liệu "{searchTerm}"
                                        </div>
                                    ) : (
                                        filteredMaterials.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleSelect(m)}
                                                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-emerald-500/10 transition-colors ${selectedMaterial?.id === m.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300'}`}
                                            >
                                                <span>{m.name}</span>
                                                <span className="text-xs text-slate-500 font-mono tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                                                    {m.unit} {m.base_amount > 1 ? `(${m.base_amount}g/ml)` : ''}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Quantities & Add Button */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                        {/* Quantity Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">
                                Nhập theo Số Lượng
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="glass-input pr-12"
                                    placeholder="VD: 1, 2..."
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                                    {selectedMaterial?.unit || 'Đơn vị'}
                                </span>
                            </div>
                        </div>

                        {/* Weight Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">
                                Nhập theo Khối Lượng
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="glass-input pr-12"
                                    placeholder="VD: 500, 1000..."
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                                    g / ml
                                </span>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleAddEntry}
                                disabled={!selectedMaterial || (!quantity && !weight)}
                                className="glass-button primary w-full h-[42px] justify-center"
                            >
                                <Plus size={18} /> Thêm vào phiếu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview List */}
                {entries.length > 0 && (
                    <div className="mt-8">
                        <h4 className="text-slate-300 font-medium mb-3">Danh sách chờ lưu ({entries.length})</h4>
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-800 text-slate-200 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3">Nguyên Liệu</th>
                                        <th className="p-3 text-right">Số lượng</th>
                                        <th className="p-3 text-right">Khối lượng</th>
                                        <th className="p-3 text-right">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-slate-900/50">
                                    {entries.map(e => (
                                        <tr key={e.tempId}>
                                            <td className="p-3 font-medium text-white">
                                                {e.material.name}
                                                <div className="text-xs text-slate-500">{format(new Date(e.date), 'dd/MM')}</div>
                                            </td>
                                            <td className="p-3 text-right font-mono-numbers">
                                                {e.quantity ? <span className="text-emerald-400">{e.quantity} {e.material.base_unit}</span> : '-'}
                                            </td>
                                            <td className="p-3 text-right font-mono-numbers">
                                                {e.weight ? <span className="text-blue-400">{e.weight} g/ml</span> : '-'}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => removeEntry(e.tempId)} className="text-rose-400 hover:text-rose-300">
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="glass-button primary px-8 py-3 text-lg"
                            >
                                {submitting ? 'Đang lưu...' : (
                                    <>
                                        <Save size={20} /> Lưu Phiếu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
