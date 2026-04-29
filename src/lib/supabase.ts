import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lplrrwhiibaihooqtagz.supabase.co';
const supabaseAnonKey = 'sb_publishable_l7PQ4l1tHbvlEdrAi5UGVQ_R1RphqTE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface Employee {
  id: string;
  name: string;
  employee_id: string;
  position: string;
  avatar?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  employee_id: string;
  customer_name?: string;
  customer_type: 'new' | 'existing';
  product: 'iPhone' | 'iPad' | 'Mac' | 'Apple Watch' | 'AirPods' | 'Other';
  purchase_type: 'full' | 'installment';
  installment_months?: 12 | 24 | 36;
  has_trade_in: boolean;
  trade_in_reason?: string;
  custom_reason?: string;
  amount?: number;
  date: string;
  created_at?: string;
}

// 培训任务类型
export type TrainingTaskType = 'seed_active' | 'zhi_niao' | 'live_stream' | 'exam' | 'mini_program' | 'da_da_le';

// 单个员工培训任务
export interface EmployeeTrainingTask {
  task_type: TrainingTaskType;
  completed: boolean;
}

// 周培训记录
export interface WeeklyTraining {
  id: string;
  week_start_date: string;
  year: number;
  week_number: number;
  tasks: Record<string, EmployeeTrainingTask[]>;
  created_at?: string;
  updated_at?: string;
}

// 周度计划目标
export interface WeeklyPlanTarget {
  iphone_baseline: number;
  iphone_trade_in_rate_min: number;
  iphone_trade_in_rate_target: number;
  all_category_trade_in_rate_min: number;
  all_category_trade_in_rate_target: number;
  installment_target: number;
}

// 单个员工周度目标
export interface EmployeeWeeklyTarget {
  employee_id: string;
  employee_name: string;
  iphone_target: number;
  iphone_trade_in_target: number;
  host_target: number;
  all_category_trade_in_target: number;
  installment_target: number;
}

// 周度计划
export interface WeeklyPlan {
  id: string;
  week_start_date: string;
  year: number;
  week_number: number;
  targets: WeeklyPlanTarget;
  employee_targets: EmployeeWeeklyTarget[];
  created_at?: string;
  updated_at?: string;
}

// 初始化数据库表（如果不存在）
export async function initializeDatabase() {
  try {
    // 尝试查询员工表，如果不存在会自动创建
    const { error } = await supabase.from('employees').select('id').limit(1);

    if (error) {
      console.log('需要初始化数据库表，请通过Supabase Dashboard执行以下SQL：');
      console.log(`
-- 员工表
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  position TEXT DEFAULT '销售顾问',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  customer_name TEXT,
  customer_type TEXT DEFAULT 'new',
  product TEXT NOT NULL,
  purchase_type TEXT DEFAULT 'full',
  installment_months INTEGER,
  has_trade_in BOOLEAN DEFAULT false,
  trade_in_reason TEXT,
  custom_reason TEXT,
  amount REAL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 周培训记录表
CREATE TABLE IF NOT EXISTS public.weekly_training (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  tasks JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 周度计划表
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  targets JSONB NOT NULL,
  employee_targets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 禁用RLS（仅用于开发）
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_training DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans DISABLE ROW LEVEL SECURITY;
      `);
      return false;
    }
    return true;
  } catch (e) {
    console.error('数据库初始化失败:', e);
    return false;
  }
}
