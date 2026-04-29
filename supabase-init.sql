-- Apple Store Sales Management System - 数据库初始化脚本
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- ============================================
-- 1. 员工表 (employees)
-- ============================================
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  position TEXT DEFAULT '销售顾问',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.employees IS '员工信息表';
COMMENT ON COLUMN public.employees.id IS '员工唯一标识（UUID）';
COMMENT ON COLUMN public.employees.name IS '员工姓名';
COMMENT ON COLUMN public.employees.employee_id IS '员工工号';
COMMENT ON COLUMN public.employees.position IS '职位';
COMMENT ON COLUMN public.employees.avatar IS '头像URL';
COMMENT ON COLUMN public.employees.is_active IS '是否在职';

-- ============================================
-- 2. 订单表 (orders)
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  customer_name TEXT,
  customer_type TEXT DEFAULT 'new' CHECK (customer_type IN ('new', 'existing')),
  product TEXT NOT NULL CHECK (product IN ('iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods', 'Other')),
  purchase_type TEXT DEFAULT 'full' CHECK (purchase_type IN ('full', 'installment')),
  installment_months INTEGER CHECK (installment_months IN (12, 24, 36)),
  has_trade_in BOOLEAN DEFAULT false,
  trade_in_reason TEXT,
  custom_reason TEXT,
  amount REAL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.orders IS '销售订单表';
COMMENT ON COLUMN public.orders.id IS '订单唯一标识（UUID）';
COMMENT ON COLUMN public.orders.employee_id IS '关联员工ID';
COMMENT ON COLUMN public.orders.customer_name IS '客户姓名';
COMMENT ON COLUMN public.orders.customer_type IS '客户类型：new=新客户, existing=existing客户';
COMMENT ON COLUMN public.orders.product IS '产品类型';
COMMENT ON COLUMN public.orders.purchase_type IS '购买类型：full=全款, installment=分期';
COMMENT ON COLUMN public.orders.installment_months IS '分期月数';
COMMENT ON COLUMN public.orders.has_trade_in IS '是否有以旧换新';
COMMENT ON COLUMN public.orders.trade_in_reason IS '以旧换新原因';
COMMENT ON COLUMN public.orders.custom_reason IS '自定义原因';
COMMENT ON COLUMN public.orders.amount IS '订单金额';
COMMENT ON COLUMN public.orders.date IS '订单日期';

-- ============================================
-- 3. 周培训记录表 (weekly_training)
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_training (
  id TEXT PRIMARY KEY,
  week_start_date TEXT NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  tasks JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.weekly_training IS '周培训记录表';
COMMENT ON COLUMN public.weekly_training.id IS '记录唯一标识（UUID）';
COMMENT ON COLUMN public.weekly_training.week_start_date IS '周开始日期';
COMMENT ON COLUMN public.weekly_training.year IS '年份';
COMMENT ON COLUMN public.weekly_training.week_number IS '周数';
COMMENT ON COLUMN public.weekly_training.tasks IS '培训任务（JSON格式）';

-- ============================================
-- 4. 周度计划表 (weekly_plans)
-- ============================================
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

-- 添加注释
COMMENT ON TABLE public.weekly_plans IS '周度计划表';
COMMENT ON COLUMN public.weekly_plans.id IS '计划唯一标识（UUID）';
COMMENT ON COLUMN public.weekly_plans.week_start_date IS '周开始日期';
COMMENT ON COLUMN public.weekly_plans.year IS '年份';
COMMENT ON COLUMN public.weekly_plans.week_number IS '周数';
COMMENT ON COLUMN public.weekly_plans.targets IS '总体目标（JSON格式）';
COMMENT ON COLUMN public.weekly_plans.employee_targets IS '员工目标（JSON数组）';

-- ============================================
-- 5. 禁用行级安全策略 (RLS)
-- 为了方便使用，暂时禁用RLS
-- 生产环境建议启用并配置适当的策略
-- ============================================
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_training DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. 创建索引（可选，提升查询性能）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON public.orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_training_week ON public.weekly_training(year, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week ON public.weekly_plans(year, week_number);

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库初始化完成！';
  RAISE NOTICE '已创建的表：';
  RAISE NOTICE '  1. public.employees - 员工信息表';
  RAISE NOTICE '  2. public.orders - 销售订单表';
  RAISE NOTICE '  3. public.weekly_training - 周培训记录表';
  RAISE NOTICE '  4. public.weekly_plans - 周度计划表';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  行级安全策略(RLS)已禁用';
  RAISE NOTICE '   如需启用，请执行：';
  RAISE NOTICE '   ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;';
END $$;
