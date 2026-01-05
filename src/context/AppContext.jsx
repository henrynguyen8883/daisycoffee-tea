import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDaysInMonth } from 'date-fns';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const ROLES = {
    BARTENDER: { id: 'bartender', label: 'Nhân viên pha chế', rate: 200000 },
    SERVER: { id: 'server', label: 'Nhân viên phục vụ', rate: 160000 },
    MANAGER: { id: 'manager', label: 'Quản lý', rate: 0 },
};

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [advances, setAdvances] = useState({});
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, attRes, advRes] = await Promise.all([
                supabase.from('users').select('*'),
                supabase.from('attendance').select('*'),
                supabase.from('advances').select('*')
            ]);

            if (usersRes.data) {
                // Normalize keys (Postgres returns custom_rate, we used customRate)
                const mappedUsers = usersRes.data.map(u => ({
                    ...u,
                    customRate: u.custom_rate // Map snake_case to camelCase
                }));
                setUsers(mappedUsers);
            }

            // Process Attendance
            const attMap = {};
            attRes.data?.forEach(record => {
                if (!attMap[record.user_id]) attMap[record.user_id] = {};
                attMap[record.user_id][record.date] = record.status;
            });
            setAttendance(attMap);

            // Process Advances
            const advMap = {};
            advRes.data?.forEach(record => {
                if (!advMap[record.user_id]) advMap[record.user_id] = [];
                advMap[record.user_id].push({
                    id: record.id,
                    amount: record.amount,
                    date: record.date
                });
            });
            setAdvances(advMap);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const addUser = async (userData) => {
        const newUser = {
            id: `u${Date.now()}`,
            name: userData.name,
            role: userData.role,
            custom_rate: userData.customRate, // Send snake_case to DB
            password: userData.password || '123'
        };

        const { error } = await supabase.from('users').insert([newUser]);
        if (!error) {
            setUsers(prev => [...prev, { ...newUser, customRate: newUser.custom_rate }]);
        } else {
            console.error("Add user error:", error);
        }
    };

    const updateUser = async (id, updates) => {
        // Map updates to snake_case for DB
        const dbUpdates = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.password) dbUpdates.password = updates.password;
        if (updates.customRate !== undefined) dbUpdates.custom_rate = updates.customRate;

        // Optimistic Update
        setUsers(prev => prev.map(u => {
            if (u.id === id) {
                const updated = { ...u, ...updates };
                if (currentUser?.id === id) setCurrentUser(updated);
                return updated;
            }
            return u;
        }));

        const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
        if (error) console.error("Update user error:", error);
    };

    const deleteUser = async (id) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        await supabase.from('users').delete().eq('id', id);
    };

    const login = (userId, password) => {
        const user = users.find(u => u.id === userId);
        if (user && user.password === password) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => setCurrentUser(null);

    const updateAttendance = async (userId, dateStr, status) => {
        // Optimistic
        setAttendance(prev => {
            const userRecord = { ...(prev[userId] || {}) };
            if (status === null) delete userRecord[dateStr];
            else userRecord[dateStr] = status;
            return { ...prev, [userId]: userRecord };
        });

        if (status === null) {
            await supabase.from('attendance')
                .delete()
                .eq('user_id', userId)
                .eq('date', dateStr);
        } else {
            await supabase.from('attendance').upsert({
                user_id: userId,
                date: dateStr,
                status: status
            }, { onConflict: 'user_id,date' });
        }
    };

    const addAdvance = async (userId, amount) => {
        const dateStr = new Date().toISOString();
        const { data, error } = await supabase.from('advances').insert([{
            user_id: userId,
            amount,
            date: dateStr
        }]).select();

        if (data) {
            setAdvances(prev => {
                const userAdvances = prev[userId] || [];
                return { ...prev, [userId]: [...userAdvances, { ...data[0] }] };
            });
        }
    };

    const calculateSalary = (userId, year, month) => {
        const user = users.find(u => u.id === userId);
        if (!user || user.role === 'manager') return null;

        const roleData = Object.values(ROLES).find(r => r.id === user.role);
        if (!roleData) return null;

        const dailyRate = user.customRate !== undefined && user.customRate !== null ? Number(user.customRate) : roleData.rate;
        const userAttendance = attendance[userId] || {};
        const daysInMonth = getDaysInMonth(new Date(year, month));

        let workedDays = 0;
        let offDaysTaken = 0;

        Object.entries(userAttendance).forEach(([dateStr, status]) => {
            const date = new Date(dateStr);
            if (date.getFullYear() === year && date.getMonth() === month) {
                if (status === 'WORKED') workedDays++;
                if (status === 'OFF') offDaysTaken++;
            }
        });

        let bonusDays = 0;
        if (daysInMonth === 31) bonusDays += 1;
        if (offDaysTaken === 0 && workedDays > 0) bonusDays += 2;

        const totalPaidDays = workedDays + bonusDays;
        const totalSalary = totalPaidDays * dailyRate;

        // Advance Logic - Max 70% of WORKED days (excluding bonus)
        const maxAdvanceLimit = workedDays * dailyRate * 0.7;

        const userAdvances = advances[userId] || [];
        let totalAdvanced = 0;

        userAdvances.forEach(adv => {
            const advDate = new Date(adv.date);
            if (advDate.getFullYear() === year && advDate.getMonth() === month) {
                totalAdvanced += adv.amount;
            }
        });

        const remainingAdvanceLimit = Math.max(0, maxAdvanceLimit - totalAdvanced);
        const finalPayout = totalSalary - totalAdvanced;

        return {
            workedDays,
            offDaysTaken,
            bonusDays,
            rate: dailyRate,
            totalSalary,
            maxAdvanceLimit,
            totalAdvanced,
            remainingAdvanceLimit,
            finalPayout,
            currency: 'VND'
        };
    };

    return (
        <AppContext.Provider value={{
            currentUser, users, login, logout,
            addUser, updateUser, deleteUser,
            attendance, updateAttendance,
            advances, addAdvance,
            calculateSalary, ROLES, loading
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
