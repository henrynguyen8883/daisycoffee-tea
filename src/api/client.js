
// MOCK API IMPLEMENTATION (Client-side only for demo/dev)
// Uses LocalStorage to simulate Backend DB

const STORAGE_KEYS = {
    MATERIALS: 'materials_db',
    USAGE: 'materials_usage_db'
};

// Helper: Simulate Network Delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const getStored = (key, defaultVal) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
};

const setStored = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Seed Data if Empty
const seedMaterials = [
    { id: 1, name: 'Trà Lài', base_unit: 'bi', base_amount: 1, base_price: 99000 },
    { id: 2, name: 'Matcha Đài Loan', base_unit: 'g', base_amount: 1000, base_price: 350000 },
    { id: 3, name: 'Ly Nhựa Logo', base_unit: 'cai', base_amount: 50, base_price: 47000 },
    { id: 4, name: 'Sữa Đặc', base_unit: 'hop', base_amount: 1, base_price: 18000 }
];

if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
    setStored(STORAGE_KEYS.MATERIALS, seedMaterials);
}

export const api = {
    // --- Materials ---
    getMaterials: async () => {
        await delay();
        const data = getStored(STORAGE_KEYS.MATERIALS, []);
        return { data };
    },

    addMaterial: async (material) => {
        await delay();
        const mats = getStored(STORAGE_KEYS.MATERIALS, []);
        const newId = mats.length > 0 ? Math.max(...mats.map(m => m.id)) + 1 : 1;
        const newMat = { ...material, id: newId, created_at: new Date().toISOString() };
        mats.push(newMat);
        setStored(STORAGE_KEYS.MATERIALS, mats);
        return { data: newMat };
    },

    // --- Usage Logs ---
    logUsage: async (usageData) => {
        await delay();
        // Calculate Total Price
        // Validations: usageData has { material_id, quantity (optional), weight (optional) }
        const mats = getStored(STORAGE_KEYS.MATERIALS, []);
        const material = mats.find(m => m.id === usageData.material_id);

        if (!material) throw new Error('Material not found');

        let totalPrice = 0;

        // Logic:
        // By Quantity: quantity * price (Assume base_price is per base_amount? No, usually Base Unit is e.g. "Bich", Base Amount = 1. Price is per Bich.)
        // Requirements say: 
        // IF quantity: total = quantity * price (Wait, usually price is per unit. But if Base is 500g, Price is for 500g. If I use 200g?)

        // Let's stick to the specific Logic required:
        // 1. Quantity: total = quantity * base_price
        //    (Assumes base_price is for 1 unit if quantity is used. 
        //     Example: "Ly Logo", Qty 4. Price 47k. Total 188k.
        //     So base_price is price PER ITEM if Qty is used?)

        // 2. Weight (g/ml): total = (weight / base_amount) * base_price
        //    Example: Matcha. Base 1000g. Price 350k. Used 300g.
        //    Total = (300 / 1000) * 350k = 105k. Correct.

        if (usageData.quantity) {
            // Case 1: Quantity
            // CAUTION: If user sets Base Amount = 50 Ly, and Price = 47k.
            // Does "Quantity: 1" mean 1 Ly or 1 Package (50 Ly)?
            // In "Ly co logo" example: "4" items -> 4 * 47 = 188k. 
            // If base_price 47k is for 50 Ly... then 4 Ly is tiny cost.
            // BUT Example says: "4 x 47 = 188k". So 47k is the price OF THE UNIT USED IN QUANTITY.
            // OR 47k is the price of a PACK, and Qty=4 means 4 PACKS?
            // "Ly co logo", qty 4. logic: 4*47.
            // "Tra lai", qty 3. logic: 3*99 = 297k.
            // This implies "Quantity" refers to the PACKAGES imported (e.g. 3 Bags of Tea).
            // And "Weight" refers to PARTIAL usage (e.g. 300g of Matcha powder).

            // So: Quantity * Base Price is correct for "Importing Packs".
            totalPrice = usageData.quantity * material.base_price;
        } else if (usageData.weight) {
            // Case 2: Weight
            // (weight / base_amount) * base_price
            if (!material.base_amount) throw new Error('Invalid base amount');
            totalPrice = (usageData.weight / material.base_amount) * material.base_price;
        }

        const logs = getStored(STORAGE_KEYS.USAGE, []);
        const newLog = {
            id: Date.now(),
            ...usageData,
            total_price: Math.round(totalPrice), // Round to integer VND
            created_at: new Date().toISOString()
        };
        logs.push(newLog);
        setStored(STORAGE_KEYS.USAGE, logs);

        return { data: newLog };
    },

    getReports: async (startDate, endDate) => {
        await delay();
        const logs = getStored(STORAGE_KEYS.USAGE, []);
        const mats = getStored(STORAGE_KEYS.MATERIALS, []);

        // Filter by Date
        const filtered = logs.filter(log => {
            // log.date is YYYY-MM-DD
            return log.date >= startDate && log.date <= endDate;
        });

        // Enrich Data
        const enriched = filtered.map(log => {
            const mat = mats.find(m => m.id === log.material_id);
            return {
                ...log,
                material_name: mat ? mat.name : 'Unknown',
                base_unit: mat ? mat.base_unit : ''
            };
        });

        return { data: enriched };
    }
};
