import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, Order, DailyStats, EmployeeStats, ReasonStats, TradeInReason, TrainingTaskType, EmployeeTrainingTask, WeeklyTraining, WeeklyPlan, WeeklyPlanTarget, EmployeeWeeklyTarget } from '../types';
import { supabase, Employee as DbEmployee, Order as DbOrder, WeeklyTraining as DbWeeklyTraining, WeeklyPlan as DbWeeklyPlan } from '../lib/supabase';

// 将数据库格式转换为应用格式
const dbEmployeeToApp = (db: DbEmployee): Employee => ({
  id: db.id,
  name: db.name,
  employeeId: db.employee_id,
  position: db.position,
  avatar: db.avatar,
  isActive: db.is_active,
});

// 将数据库格式转换为应用格式
const dbOrderToApp = (db: DbOrder): Order => ({
  id: db.id,
  employeeId: db.employee_id,
  customerName: db.customer_name,
  customerType: db.customer_type as 'new' | 'existing',
  product: db.product as Order['product'],
  purchaseType: db.purchase_type as 'full' | 'installment',
  installmentMonths: db.installment_months as 12 | 24 | 36 | undefined,
  hasTradeIn: db.has_trade_in,
  tradeInReason: db.trade_in_reason as TradeInReason | undefined,
  customReason: db.custom_reason,
  amount: db.amount,
  date: db.date,
  createdAt: db.created_at,
});

// 将应用格式转换为数据库格式
const appEmployeeToDb = (app: Employee): Partial<DbEmployee> => ({
  id: app.id,
  name: app.name,
  employee_id: app.employeeId,
  position: app.position,
  avatar: app.avatar,
  is_active: app.isActive,
});

// 将应用格式转换为数据库格式
const appOrderToDb = (app: Order): Partial<DbOrder> => ({
  id: app.id,
  employee_id: app.employeeId,
  customer_name: app.customerName || null,
  customer_type: app.customerType,
  product: app.product,
  purchase_type: app.purchaseType,
  installment_months: app.installmentMonths || null,
  has_trade_in: app.hasTradeIn,
  trade_in_reason: app.tradeInReason || null,
  custom_reason: app.customReason || null,
  amount: app.amount || null,
  date: app.date,
  created_at: app.createdAt,
});

interface AppContextType {
  // 员工管理
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // 订单管理
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  importOrders: (orders: Omit<Order, 'id' | 'createdAt'>[]) => void;

  // 培训任务管理
  weeklyTrainings: WeeklyTraining[];
  getWeeklyTraining: (weekStartDate: string) => WeeklyTraining | undefined;
  updateEmployeeTaskCompletion: (weekStartDate: string, employeeId: string, taskType: TrainingTaskType, completed: boolean) => void;

  // 统计数据
  getDailyStats: (date?: string) => DailyStats;
  getEmployeeStats: (employeeId: string, date?: string) => EmployeeStats;
  getAllEmployeeStats: (date?: string) => EmployeeStats[];
  getReasonStats: (date?: string) => ReasonStats[];

  // 当前选中日期
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // 刷新数据
  refreshData: () => void;

  // 同步状态
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: string | null;

  // 周度计划管理
  weeklyPlans: WeeklyPlan[];
  getWeeklyPlan: (weekStartDate: string) => WeeklyPlan | undefined;
  saveWeeklyPlan: (plan: WeeklyPlan) => void;
  deleteWeeklyPlan: (weekStartDate: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 培训任务类型列表
export const TRAINING_TASK_TYPES: TrainingTaskType[] = [
  'seed_active',
  'zhi_niao',
  'live_stream',
  'exam',
  'mini_program',
  'da_da_le',
];

// 转换数据库格式到应用格式
const dbWeeklyTrainingToApp = (db: DbWeeklyTraining): WeeklyTraining => ({
  id: db.id,
  weekStartDate: db.week_start_date,
  year: db.year,
  weekNumber: db.week_number,
  tasks: db.tasks,
  createdAt: db.created_at || '',
  updatedAt: db.updated_at || '',
});

// 转换应用格式到数据库格式
const appWeeklyTrainingToDb = (app: WeeklyTraining): Partial<DbWeeklyTraining> => ({
  id: app.id,
  week_start_date: app.weekStartDate,
  year: app.year,
  week_number: app.weekNumber,
  tasks: app.tasks,
});

// 转换数据库格式到应用格式（周度计划）
const dbWeeklyPlanToApp = (db: DbWeeklyPlan): WeeklyPlan => ({
  id: db.id,
  weekStartDate: db.week_start_date,
  year: db.year,
  weekNumber: db.week_number,
  targets: {
    iphoneBaseline: db.targets.iphone_baseline,
    iphoneTradeInRateMin: db.targets.iphone_trade_in_rate_min,
    iphoneTradeInRateTarget: db.targets.iphone_trade_in_rate_target,
    allCategoryTradeInRateMin: db.targets.all_category_trade_in_rate_min,
    allCategoryTradeInRateTarget: db.targets.all_category_trade_in_rate_target,
    installmentTarget: db.targets.installment_target,
  },
  employeeTargets: db.employee_targets.map((t: any) => ({
    employeeId: t.employee_id,
    employeeName: t.employee_name,
    iphoneTarget: t.iphone_target,
    iphoneTradeInTarget: t.iphone_trade_in_target,
    hostTarget: t.host_target,
    allCategoryTradeInTarget: t.all_category_trade_in_target,
    installmentTarget: t.installment_target,
  })),
  createdAt: db.created_at || '',
  updatedAt: db.updated_at || '',
});

// 转换应用格式到数据库格式（周度计划）
const appWeeklyPlanToDb = (app: WeeklyPlan): Partial<DbWeeklyPlan> => ({
  id: app.id,
  week_start_date: app.weekStartDate,
  year: app.year,
  week_number: app.weekNumber,
  targets: {
    iphone_baseline: app.targets.iphoneBaseline,
    iphone_trade_in_rate_min: app.targets.iphoneTradeInRateMin,
    iphone_trade_in_rate_target: app.targets.iphoneTradeInRateTarget,
    all_category_trade_in_rate_min: app.targets.allCategoryTradeInRateMin,
    all_category_trade_in_rate_target: app.targets.allCategoryTradeInRateTarget,
    installment_target: app.targets.installmentTarget,
  },
  employee_targets: app.employeeTargets.map(t => ({
    employee_id: t.employeeId,
    employee_name: t.employeeName,
    iphone_target: t.iphoneTarget,
    iphone_trade_in_target: t.iphoneTradeInTarget,
    host_target: t.hostTarget,
    all_category_trade_in_target: t.allCategoryTradeInTarget,
    installment_target: t.installmentTarget,
  })),
});

// 获取指定周的周一日期
const getWeekStartDate = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一作为周开始
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

// 获取一年中的第几周
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [weeklyTrainings, setWeeklyTrainings] = useState<WeeklyTraining[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 周度计划状态
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);

  // 初始化：从云端加载数据（不再使用localStorage）
  useEffect(() => {
    const initializeApp = async () => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        // 从云端加载员工数据
        const { data: cloudEmployees, error: empError } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: true });

        if (empError) {
          console.warn('云端加载员工失败:', empError);
          setSyncError('加载员工数据失败');
          setEmployees([]);  // 云端加载失败则设为空
        } else if (cloudEmployees && cloudEmployees.length > 0) {
          const appEmployees = cloudEmployees.map(dbEmployeeToApp);
          setEmployees(appEmployees);
          console.log('从云端加载了', appEmployees.length, '个员工');
        } else {
          // 云端没有数据，设为空
          console.log('云端暂无员工数据');
          setEmployees([]);
        }

        // 从云端加载订单数据
        const { data: cloudOrders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (orderError) {
          console.warn('云端加载订单失败:', orderError);
          setSyncError('加载订单数据失败');
          setOrders([]);  // 云端加载失败则设为空
        } else if (cloudOrders && cloudOrders.length > 0) {
          const appOrders = cloudOrders.map(dbOrderToApp);
          setOrders(appOrders);
          console.log('从云端加载了', appOrders.length, '条订单');
        } else {
          // 云端没有订单，设为空
          console.log('云端暂无订单数据');
          setOrders([]);
        }

        // 从云端加载培训数据
        const { data: cloudTrainings, error: trainingError } = await supabase
          .from('weekly_training')
          .select('*')
          .order('week_start_date', { ascending: false });

        if (trainingError) {
          console.warn('云端加载培训数据失败:', trainingError);
          setWeeklyTrainings([]);  // 云端加载失败则设为空
        } else if (cloudTrainings && cloudTrainings.length > 0) {
          const appTrainings = cloudTrainings.map(dbWeeklyTrainingToApp);
          setWeeklyTrainings(appTrainings);
          console.log('从云端加载了', appTrainings.length, '条培训记录');
        } else {
          console.log('云端暂无培训数据');
          setWeeklyTrainings([]);
        }

        // 从云端加载周度计划
        const { data: cloudPlans, error: plansError } = await supabase
          .from('weekly_plans')
          .select('*')
          .order('week_start_date', { ascending: false });

        if (plansError) {
          console.warn('云端加载周度计划失败:', plansError);
          setWeeklyPlans([]);  // 云端加载失败则设为空
        } else if (cloudPlans && cloudPlans.length > 0) {
          const appPlans = cloudPlans.map(dbWeeklyPlanToApp);
          setWeeklyPlans(appPlans);
          console.log('从云端加载了', appPlans.length, '条周度计划');
        } else {
          console.log('云端暂无周度计划');
          setWeeklyPlans([]);
        }

        setLastSyncTime(new Date().toISOString());
        console.log('云端同步完成');
      } catch (error) {
        console.error('云端同步失败:', error);
        setSyncError('云端同步失败');
        // 发生错误时清空所有数据，不再使用本地缓存
        setEmployees([]);
        setOrders([]);
        setWeeklyTrainings([]);
        setWeeklyPlans([]);
      }

      setIsSyncing(false);
      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  // 不再使用localStorage备份 - 全部数据存储在云端

  // 同步培训记录到云端
  const syncTrainingToCloud = async (training: WeeklyTraining, action: 'insert' | 'update' | 'delete') => {
    try {
      if (action === 'insert') {
        await supabase.from('weekly_training').insert(appWeeklyTrainingToDb(training));
      } else if (action === 'update') {
        await supabase.from('weekly_training').update(appWeeklyTrainingToDb(training)).eq('id', training.id);
      } else if (action === 'delete') {
        await supabase.from('weekly_training').delete().eq('id', training.id);
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('同步培训记录到云端失败:', error);
      setSyncError('部分数据可能未同步到云端');
    }
  };

  // 同步员工到云端
  const syncEmployeeToCloud = async (employee: Employee, action: 'insert' | 'update' | 'delete') => {
    try {
      if (action === 'insert') {
        await supabase.from('employees').insert(appEmployeeToDb(employee));
      } else if (action === 'update') {
        await supabase.from('employees').update(appEmployeeToDb(employee)).eq('id', employee.id);
      } else if (action === 'delete') {
        await supabase.from('employees').delete().eq('id', employee.id);
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('同步员工到云端失败:', error);
      setSyncError('部分数据可能未同步到云端');
    }
  };

  // 同步订单到云端
  const syncOrderToCloud = async (order: Partial<Order> & { id: string }, action: 'insert' | 'update' | 'delete') => {
    try {
      if (action === 'insert') {
        await supabase.from('orders').insert(appOrderToDb(order as Order));
      } else if (action === 'update') {
        await supabase.from('orders').update(appOrderToDb(order as Order)).eq('id', order.id);
      } else if (action === 'delete') {
        await supabase.from('orders').delete().eq('id', order.id);
      }
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('同步订单到云端失败:', error);
      setSyncError('部分数据可能未同步到云端');
    }
  };

  // 刷新数据
  const refreshData = async () => {
    setIsSyncing(true);
    try {
      // 重新加载员工数据
      const { data: cloudEmployees } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true });

      if (cloudEmployees && cloudEmployees.length > 0) {
        setEmployees(cloudEmployees.map(dbEmployeeToApp));
      }

      // 重新加载订单数据
      const { data: cloudOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders.map(dbOrderToApp));
      }

      setLastSyncTime(new Date().toISOString());
      setSyncError(null);
    } catch (error) {
      console.error('刷新数据失败:', error);
      setSyncError('刷新数据失败');
    }
    setIsSyncing(false);
  };

  // 员工管理
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = { ...employee, id: generateId() };
    setEmployees([...employees, newEmployee]);
    syncEmployeeToCloud(newEmployee, 'insert');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const updatedEmployees = employees.map(emp =>
      emp.id === id ? { ...emp, ...updates } : emp
    );
    setEmployees(updatedEmployees);
    const updated = updatedEmployees.find(emp => emp.id === id);
    if (updated) {
      syncEmployeeToCloud(updated, 'update');
    }
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    syncEmployeeToCloud({ id } as Employee, 'delete');
  };

  // 订单管理
  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setOrders([newOrder, ...orders]);
    syncOrderToCloud(newOrder, 'insert');
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    const updatedOrders = orders.map(order =>
      order.id === id ? { ...order, ...updates } : order
    );
    setOrders(updatedOrders);
    const updated = updatedOrders.find(order => order.id === id);
    if (updated) {
      syncOrderToCloud(updated, 'update');
    }
  };

  const deleteOrder = (id: string) => {
    setOrders(orders.filter(order => order.id !== id));
    syncOrderToCloud({ id } as Order, 'delete');
  };

  // 批量导入订单
  const importOrders = (newOrders: Omit<Order, 'id' | 'createdAt'>[]) => {
    const ordersWithIds = newOrders.map(order => ({
      ...order,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }));

    setOrders([...ordersWithIds, ...orders]);

    // 批量同步到云端
    ordersWithIds.forEach(order => {
      syncOrderToCloud(order, 'insert');
    });
  };

  // 获取指定日期的订单
  const getOrdersByDate = (date?: string) => {
    const targetDate = date || selectedDate;
    return orders.filter(order => order.date === targetDate);
  };

  // 获取每日统计
  const getDailyStats = (date?: string): DailyStats => {
    const dateOrders = getOrdersByDate(date);
    const totalOrders = dateOrders.length;
    const totalRevenue = dateOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const tradeInCount = dateOrders.filter(order => order.hasTradeIn).length;
    const tradeInRate = totalOrders > 0 ? (tradeInCount / totalOrders) * 100 : 0;
    const installmentCount = dateOrders.filter(order => order.purchaseType === 'installment').length;
    const installmentRate = totalOrders > 0 ? (installmentCount / totalOrders) * 100 : 0;

    // 主机销量统计
    const iphoneCount = dateOrders.filter(order => order.product === 'iPhone').length;
    const otherHostCount = dateOrders.filter(order =>
      order.product === 'iPad' || order.product === 'Mac' || order.product === 'Apple Watch'
    ).length;
    const hostTotal = iphoneCount + otherHostCount;

    return {
      date: date || selectedDate,
      totalOrders,
      totalRevenue,
      tradeInCount,
      tradeInRate,
      installmentCount,
      installmentRate,
      iphoneCount,
      otherHostCount,
      hostTotal,
    };
  };

  // 获取单个员工统计
  const getEmployeeStats = (employeeId: string, date?: string): EmployeeStats => {
    const dateOrders = getOrdersByDate(date).filter(order => order.employeeId === employeeId);
    const totalOrders = dateOrders.length;
    const tradeInCount = dateOrders.filter(order => order.hasTradeIn).length;
    const tradeInRate = totalOrders > 0 ? (tradeInCount / totalOrders) * 100 : 0;
    const installmentCount = dateOrders.filter(order => order.purchaseType === 'installment').length;
    const setupCount = totalOrders;

    // 主机销量统计
    const iphoneCount = dateOrders.filter(order => order.product === 'iPhone').length;
    const otherHostCount = dateOrders.filter(order =>
      order.product === 'iPad' || order.product === 'Mac' || order.product === 'Apple Watch'
    ).length;
    const hostTotal = iphoneCount + otherHostCount;

    return {
      employeeId,
      totalOrders,
      tradeInCount,
      tradeInRate,
      installmentCount,
      setupCount,
      iphoneCount,
      otherHostCount,
      hostTotal,
    };
  };

  // 获取所有员工统计
  const getAllEmployeeStats = (date?: string): EmployeeStats[] => {
    return employees
      .filter(emp => emp.isActive)
      .map(emp => ({
        ...getEmployeeStats(emp.id, date),
        employeeId: emp.id,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders);
  };

  // 获取未成交原因统计
  const getReasonStats = (date?: string): ReasonStats[] => {
    const dateOrders = getOrdersByDate(date).filter(order => !order.hasTradeIn);
    const reasonCounts: Record<TradeInReason, number> = {
      no_need: 0,
      damaged: 0,
      price_unsatisfied: 0,
      process_complex: 0,
      considering: 0,
      other_quote: 0,
      time_pressure: 0,
      other: 0,
    };

    dateOrders.forEach(order => {
      if (order.tradeInReason) {
        reasonCounts[order.tradeInReason]++;
      }
    });

    const total = dateOrders.length;
    return Object.entries(reasonCounts)
      .filter(([_, count]) => count > 0)
      .map(([reason, count]) => ({
        reason: reason as TradeInReason,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 获取指定周的培训记录
  const getWeeklyTraining = (weekStartDate: string): WeeklyTraining | undefined => {
    return weeklyTrainings.find(t => t.weekStartDate === weekStartDate);
  };

  // 更新员工任务完成状态
  const updateEmployeeTaskCompletion = (weekStartDate: string, employeeId: string, taskType: TrainingTaskType, completed: boolean) => {
    const date = new Date(weekStartDate);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);

    // 查找是否已有该周的记录
    let existingTraining = weeklyTrainings.find(t => t.weekStartDate === weekStartDate);

    if (existingTraining) {
      // 更新现有记录
      const updatedTasks = { ...existingTraining.tasks };
      const employeeTasks = updatedTasks[employeeId] || [];

      // 查找是否已有该任务
      const taskIndex = employeeTasks.findIndex(t => t.taskType === taskType);
      if (taskIndex >= 0) {
        employeeTasks[taskIndex] = { taskType, completed };
      } else {
        employeeTasks.push({ taskType, completed });
      }
      updatedTasks[employeeId] = employeeTasks;

      const updatedTraining: WeeklyTraining = {
        ...existingTraining,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString(),
      };

      setWeeklyTrainings(weeklyTrainings.map(t =>
        t.weekStartDate === weekStartDate ? updatedTraining : t
      ));
      syncTrainingToCloud(updatedTraining, 'update');
    } else {
      // 创建新记录
      const newTraining: WeeklyTraining = {
        id: generateId(),
        weekStartDate,
        year,
        weekNumber,
        tasks: {
          [employeeId]: [{ taskType, completed }],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setWeeklyTrainings([newTraining, ...weeklyTrainings]);
      syncTrainingToCloud(newTraining, 'insert');
    }
  };

  // 获取指定周的周度计划
  const getWeeklyPlan = (weekStartDate: string): WeeklyPlan | undefined => {
    return weeklyPlans.find(p => p.weekStartDate === weekStartDate);
  };

  // 同步周度计划到云端（返回结果）
  const syncPlanToCloud = async (plan: WeeklyPlan, action: 'insert' | 'update' | 'delete'): Promise<{ error?: any }> => {
    try {
      let result;
      if (action === 'insert') {
        result = await supabase.from('weekly_plans').insert(appWeeklyPlanToDb(plan));
      } else if (action === 'update') {
        result = await supabase.from('weekly_plans').update(appWeeklyPlanToDb(plan)).eq('id', plan.id);
      } else if (action === 'delete') {
        result = await supabase.from('weekly_plans').delete().eq('id', plan.id);
      }

      if (result?.error) {
        console.error('同步周度计划到云端失败:', result.error);
        setSyncError(`云端同步失败: ${result.error.message}`);
        return { error: result.error };
      }

      setLastSyncTime(new Date().toISOString());
      console.log('周度计划同步成功:', action, plan.weekStartDate);
      return {};
    } catch (error) {
      console.error('同步周度计划到云端失败:', error);
      setSyncError('部分数据可能未同步到云端');
      return { error };
    }
  };

  // 保存周度计划（同步到云端）
  const saveWeeklyPlan = async (plan: WeeklyPlan): Promise<{ success: boolean; error?: string }> => {
    const existingIndex = weeklyPlans.findIndex(p => p.weekStartDate === plan.weekStartDate);

    if (existingIndex >= 0) {
      const updatedPlan = { ...plan, updatedAt: new Date().toISOString() };
      setWeeklyPlans(weeklyPlans.map((p, i) => i === existingIndex ? updatedPlan : p));

      // 同步到云端
      const result = await syncPlanToCloud(updatedPlan, 'update');
      return { success: !result?.error, error: result?.error?.message };
    } else {
      const newPlan = { ...plan, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setWeeklyPlans([...weeklyPlans, newPlan]);

      // 同步到云端
      const result = await syncPlanToCloud(newPlan, 'insert');
      return { success: !result?.error, error: result?.error?.message };
    }
  };

  // 删除周度计划
  const deleteWeeklyPlan = (weekStartDate: string) => {
    const planToDelete = weeklyPlans.find(p => p.weekStartDate === weekStartDate);
    if (planToDelete) {
      setWeeklyPlans(weeklyPlans.filter(p => p.weekStartDate !== weekStartDate));
      syncPlanToCloud(planToDelete, 'delete');
    }
  };

  return (
    <AppContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        importOrders,
        weeklyTrainings,
        getWeeklyTraining,
        updateEmployeeTaskCompletion,
        getDailyStats,
        getEmployeeStats,
        getAllEmployeeStats,
        getReasonStats,
        selectedDate,
        setSelectedDate,
        refreshData,
        isSyncing,
        syncError,
        lastSyncTime,
        weeklyPlans,
        getWeeklyPlan,
        saveWeeklyPlan,
        deleteWeeklyPlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
