-- =============================================
-- Apple Store Sales Management System
-- Supabase Database Setup Script
-- =============================================

-- 创建 employees 表
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

-- 创建 orders 表
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
    amount DECIMAL(10, 2),
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 启用 Row Level Security (RLS)
-- =============================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 创建 RLS 策略 (允许所有操作)
-- =============================================

-- Employees 表策略
CREATE POLICY "Enable all for employees" ON public.employees
    FOR ALL USING (true) WITH CHECK (true);

-- Orders 表策略
CREATE POLICY "Enable all for orders" ON public.orders
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 初始化示例数据
-- =============================================

-- 插入示例员工
INSERT INTO public.employees (id, name, employee_id, position, is_active) VALUES
    ('1', '张伟', 'A001', '高级顾问', true),
    ('2', '李娜', 'A002', '销售顾问', true),
    ('3', '王强', 'A003', '销售顾问', true),
    ('4', '刘芳', 'A004', '技术支持', true),
    ('5', '陈明', 'A005', '销售顾问', true)
ON CONFLICT (id) DO NOTHING;

-- 插入示例订单
INSERT INTO public.orders (id, employee_id, customer_name, customer_type, product, purchase_type, has_trade_in, amount, date, created_at) VALUES
    ('1', '1', '张三', 'new', 'iPhone', 'full', true, 7999, NOW()::date, NOW()),
    ('2', '2', '李四', 'existing', 'Mac', 'installment', false, 9999, NOW()::date, NOW())
ON CONFLICT (id) DO NOTHING;
