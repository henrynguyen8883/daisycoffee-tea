import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDaysInMonth } from 'date-fns';

const AppContext = createContext();

const ROLES = {
    BARTENDER: { id: 'bartender', label: 'Nhân viên pha chế', rate: 200000 },
    SERVER: { id: 'server', label: 'Nhân viên phục vụ', rate: 160000 },
    MANAGER: { id: 'manager', label: 'Quản lý', rate: 0 }, // Manager salary not specified, visible only
};

const MOCK_USERS = [
    { id: 'u1', name: 'Nguyễn Văn A', role: 'bartender' },
    { id: 'u2', name: 'Trần Thị B', role: 'server' },
    { id: 'm1', name: 'Quản Lý', role: 'manager', password: 'admin' },
];

export function AppProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);

    // Users Persistence
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('users');
        return saved ? JSON.parse(saved) : MOCK_USERS;
    });

    // Advances Persistence
    const [advances, setAdvances] = useState(() => {
        const saved = localStorage.getItem('advances');
        return saved ? JSON.parse(saved) : {};
    });

    // Attendance Persistence
    const [attendance, setAttendance] = useState(() => {
        const saved = localStorage.getItem('attendance');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('advances', JSON.stringify(advances));
    }, [advances]);

    useEffect(() => {
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }, [attendance]);

    useEffect(() => {
        localStorage.setItem('users', JSON.stringify(users));
    }, [users]);

    // Actions
    const addUser = (userData) => {
        const newUser = { ...userData, id: `u${Date.now()}` };
        setUsers(prev => [...prev, newUser]);
    };

    const updateUser = (id, updates) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    };

    const deleteUser = (id) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        setAttendance(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setAdvances(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const login = (userId, password) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            if (user.role === 'manager' && password !== user.password) {
                return false;
            }
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => setCurrentUser(null);

    const updateAttendance = (userId, dateStr, status) => {
        setAttendance(prev => {
            const userRecord = prev[userId] || {};
            const newRecord = { ...userRecord };

            if (status === null) {
                delete newRecord[dateStr];
            } else {
                newRecord[dateStr] = status;
            }

            return { ...prev, [userId]: newRecord };
        });
    };

    const addAdvance = (userId, amount) => {
        const dateStr = new Date().toISOString();
        setAdvances(prev => {
            const userAdvances = prev[userId] || [];
            return { ...prev, [userId]: [...userAdvances, { date: dateStr, amount }] };
        });
    };

    const calculateSalary = (userId, year, month) => {
        const user = users.find(u => u.id === userId);
        if (!user || user.role === 'manager') return null;

        const roleData = Object.values(ROLES).find(r => r.id === user.role);
        if (!roleData) return null;

        // Custom Rate Logic
        const dailyRate = user.customRate !== undefined ? Number(user.customRate) : roleData.rate;

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

        // RULE 1: 31 days month -> +1 day salary
        if (daysInMonth === 31) {
            bonusDays += 1;
        }

        // RULE 2: No off days taken -> +2 days salary
        if (offDaysTaken === 0 && workedDays > 0) {
            bonusDays += 2;
        }

        const totalPaidDays = workedDays + bonusDays;
        const totalSalary = totalPaidDays * dailyRate;

        // Advance Logic
        // Rule: Max advance = workedDays * dailyRate * 0.7 (Strictly based on Worked Days, excluding Bonus)
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
            totalSalary, // Gross Salary
            maxAdvanceLimit,
            totalAdvanced,
            remainingAdvanceLimit,
            finalPayout, // Net Salary after advances
            currency: 'VND'
        };
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            users,
            login,
            logout,
            addUser,
            updateUser,
            deleteUser,
            attendance,
            updateAttendance,
            advances,
            addAdvance,
            calculateSalary,
            ROLES
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
