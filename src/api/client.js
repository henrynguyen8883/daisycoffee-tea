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
            base_amount: material.base_amount || 1, // Default 1 if not specified
            category: material.category || 'Other'
        };

        const { data, error } = await supabase.from('materials').insert([dbMaterial]).select();

        if (error) throw error;
        return { data: data[0] };
    },

    updateMaterial: async (id, material) => {
        const dbMaterial = {
            name: material.name,
            unit: material.unit,
            price_per_unit: material.price_per_unit || 0,
            base_amount: material.base_amount || 1,
            category: material.category || 'Other'
        };

        const { data, error } = await supabase
            .from('materials')
            .update(dbMaterial)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { data: data[0] };
    },

    deleteMaterial: async (id) => {
        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    },

    // --- Usage Logs ---
    logUsage: async (usageData) => {
        // 1. Fetch Material to get current Price & Base Amount
        const { data: material, error: matError } = await supabase
            .from('materials')
            .select('*')
            .eq('id', usageData.material_id)
            .single();

        if (matError || !material) throw new Error('Material not found');

        const baseAmount = material.base_amount || 1;
        const pricePerPackage = material.price_per_unit; // This is now "Price Per Package" (e.g. 350k)

        // 2. Calculate Cost
        let totalCost = 0;

        // If usage is by Weight (g/ml) and material matches (g/ml)
        if (usageData.weight && (material.unit === 'g' || material.unit === 'ml')) {
            // Cost = (Weight Used / Package Weight) * Package Price
            // e.g. Used 50g from 500g Bag (350k) -> (50/500) * 350k = 35k
            totalCost = (usageData.weight / baseAmount) * pricePerPackage;
        }
        // If usage is by Quantity (Bag, Box, Pcs)
        // OR "g" unit but input as Quantity (e.g. 2 bags of Matcha)
        else if (usageData.quantity) {
            // Cost = Quantity * Package Price
            // e.g. Used 2 Bags -> 2 * 350k
            totalCost = usageData.quantity * pricePerPackage;
        }

        // 3. Insert Log
        const { data, error } = await supabase.from('material_usage').insert([{
            material_id: usageData.material_id,
            date: usageData.date,
            quantity: usageData.quantity || 0,
            weight: usageData.weight || 0, // Ensure weight is also saved if present
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
        // UI Expects: material_name, base_unit, total_price
        const reportData = data.map(item => ({
            ...item,
            material_name: item.materials?.name || 'Unknown',
            base_unit: item.materials?.unit || '',
            total_price: item.total_cost || 0
        }));

        return { data: reportData };
    }
};
