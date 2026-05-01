-- Apple Store Sales Management System - 数据库初始化脚本
-- 请在 Supabase Dashboard → SQL Editor 中运行此脚本

-- 1. 员工表
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

-- 2. 订单表
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bundle_type TEXT,
  has_acs BOOLEAN DEFAULT false,
  has_ruiyi BOOLEAN DEFAULT false
);

-- 3. 周培训记录表
CREATE TABLE IF NOT EXISTS public.weekly_training (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  tasks JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 周度计划表
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

-- 5. 禁用行级安全（RLS）- 方便开发使用
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_training DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans DISABLE ROW LEVEL SECURITY;

-- 6. 创建索引（优化查询性能）
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON public.orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 完成提示
SELECT '数据库初始化完成！' as message;
