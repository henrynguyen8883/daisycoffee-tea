import { supabase } from '../lib/supabase';

export const api = {
    // --- Materials ---
    getMaterials: async () => {
        const { data, error } = await supabase.from('materials').select('*');
        if (error) {
            console.error("Error fetching materials:", error);
            return { data: [] };
        }
        return { data };
    },

    addMaterial: async (material) => {
        // Map frontend fields (if differ) to DB fields?
        // Frontend sends: name, unit, price (price_per_unit), category
        // DB uses: name, unit, price_per_unit, category
        // Ensure names match.
        const dbMaterial = {
            name: material.name,
            unit: material.unit,
            price_per_unit: material.price_per_unit || material.base_price || 0,
            category: material.category || 'Other'
        };

        const { data, error } = await supabase.from('materials').insert([dbMaterial]).select();

        if (error) throw error;
        return { data: data[0] };
    },

    // --- Usage Logs ---
    logUsage: async (usageData) => {
        // 1. Fetch Material to get current Price
        const { data: material, error: matError } = await supabase
            .from('materials')
            .select('*')
            .eq('id', usageData.material_id)
            .single();

        if (matError || !material) throw new Error('Material not found');

        // 2. Calculate Cost
        // Schema: price_per_unit is Cost Per 1 Unit (g, ml, or pcs)
        let totalCost = 0;

        if (usageData.weight && (material.unit === 'g' || material.unit === 'ml')) {
            // Price is per gram/ml
            totalCost = usageData.weight * material.price_per_unit;
        } else if (usageData.quantity) {
            // Price is per piece/bag (if unit is pcs/hop/cai)
            // OR if it's 'g' but quantity used (logic ambiguity, fallback to direct Mult)
            totalCost = usageData.quantity * material.price_per_unit;
        }

        // 3. Insert Log
        const { data, error } = await supabase.from('material_usage').insert([{
            material_id: usageData.material_id,
            date: usageData.date,
            quantity: usageData.quantity || 0,
            total_cost: totalCost
        }]).select();

        if (error) throw error;
        return { data: data[0] };
    },

    // --- Reports ---
    getReports: async () => {
        // Join material_usage with materials
        const { data, error } = await supabase
            .from('material_usage')
            .select('*, materials(name, unit)');

        if (error) {
            console.error("Error fetching reports:", error);
            return { data: [] };
        }

        // Transform if necessary to match UI expectation
        // UI likely expects: materialName, unit, ...
        const reportData = data.map(item => ({
            ...item,
            materialName: item.materials?.name,
            unit: item.materials?.unit
        }));

        return { data: reportData };
    }
};
