// 员工类型定义
export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  position: string;
  avatar?: string;
  isActive: boolean;
}

// 客户类型
export type CustomerType = 'new' | 'existing';

// 产品类型
export type ProductType = 'iPhone' | 'iPad' | 'Mac' | 'Apple Watch' | 'AirPods' | 'Other';

// 购买类型
export type PurchaseType = 'full' | 'installment';

// 分期期数
export type InstallmentMonths = 12 | 24 | 36;

// 以旧换新未成交原因
export type TradeInReason =
  | 'no_need'
  | 'damaged'
  | 'price_unsatisfied'
  | 'process_complex'
  | 'considering'
  | 'other_quote'
  | 'time_pressure'
  | 'other';

// 订单类型定义
export interface Order {
  id: string;
  employeeId: string;
  customerName?: string;
  customerType: CustomerType;
  product: ProductType;
  purchaseType: PurchaseType;
  installmentMonths?: InstallmentMonths;
  hasTradeIn: boolean;
  tradeInReason?: TradeInReason;
  customReason?: string;
  amount?: number;
  date: string;
  createdAt: string;
}

// 每日统计类型
export interface DailyStats {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  tradeInCount: number;
  tradeInRate: number;
  installmentCount: number;
  installmentRate: number;
  // 主机销量统计
  iphoneCount: number;
  otherHostCount: number;
  hostTotal: number;
}

// 员工统计数据
export interface EmployeeStats {
  employeeId: string;
  totalOrders: number;
  tradeInCount: number;
  tradeInRate: number;
  installmentCount: number;
  setupCount: number;
  // 主机销量统计
  iphoneCount: number;
  otherHostCount: number;
  hostTotal: number;
}

// 原因统计数据
export interface ReasonStats {
  reason: TradeInReason;
  count: number;
  percentage: number;
}

// 预设原因映射（中文）
export const TRADE_IN_REASON_LABELS: Record<TradeInReason, string> = {
  no_need: '客户表示不需要（旧机还能用）',
  damaged: '旧机损坏严重（不值钱）',
  price_unsatisfied: '补贴金额不满意',
  process_complex: '流程太复杂',
  considering: '客户考虑中',
  other_quote: '已有其他渠道报价',
  time_pressure: '客户赶时间',
  other: '其他原因',
};

// 产品价格估算
export const PRODUCT_PRICES: Record<ProductType, number> = {
  'iPhone': 7999,
  'iPad': 4999,
  'Mac': 9999,
  'Apple Watch': 3299,
  'AirPods': 1499,
  'Other': 2999,
};

// =============================================
// 培训任务类型定义
// =============================================

// 培训任务类型
export type TrainingTaskType =
  | 'seed_active'      // SEED活跃
  | 'zhi_niao'         // 知鸟周度任务
  | 'live_stream'      // 主机直播
  | 'exam'             // 主机考试
  | 'mini_program'     // 小程序
  | 'da_da_le';       // 答答乐

// 培训任务标签映射
export const TRAINING_TASK_LABELS: Record<TrainingTaskType, string> = {
  seed_active: 'SEED活跃',
  zhi_niao: '知鸟周度任务',
  live_stream: '主机直播',
  exam: '主机考试',
  mini_program: '小程序',
  da_da_le: '答答乐',
};

// 培训任务图标映射
export const TRAINING_TASK_ICONS: Record<TrainingTaskType, string> = {
  seed_active: '🌱',
  zhi_niao: '📚',
  live_stream: '📺',
  exam: '✍️',
  mini_program: '📱',
  da_da_le: '💬',
};

// 单个员工培训任务记录
export interface EmployeeTrainingTask {
  taskType: TrainingTaskType;
  completed: boolean;
}

// 周培训记录
export interface WeeklyTraining {
  id: string;
  weekStartDate: string;  // 周开始日期 (周一)
  year: number;
  weekNumber: number;
  tasks: Record<string, EmployeeTrainingTask[]>; // employeeId -> tasks
  createdAt: string;
  updatedAt: string;
}

// =============================================
// 周度计划类型定义
// =============================================

// 周度计划目标
export interface WeeklyPlanTarget {
  // iPhone销量基线
  iphoneBaseline: number;
  // iPhone换新率底标（最低要求）
  iphoneTradeInRateMin: number;
  // iPhone换新率目标
  iphoneTradeInRateTarget: number;
  // 全品类换新率底标
  allCategoryTradeInRateMin: number;
  // 全品类换新率目标
  allCategoryTradeInRateTarget: number;
  // 分期目标单数
  installmentTarget: number;
}

// 单个员工的周度目标分解
export interface EmployeeWeeklyTarget {
  employeeId: string;
  employeeName: string;
  // iPhone销量目标
  iphoneTarget: number;
  // 需要完成的以旧换新数量（基于iPhone销量和换新率目标）
  iphoneTradeInTarget: number;
  // 主机销量目标（基于基线）
  hostTarget: number;
  // 全品类换新目标
  allCategoryTradeInTarget: number;
  // 分期目标
  installmentTarget: number;
}

// 周度计划
export interface WeeklyPlan {
  id: string;
  weekStartDate: string;  // 周开始日期 (周日)
  year: number;
  weekNumber: number;
  targets: WeeklyPlanTarget;
  employeeTargets: EmployeeWeeklyTarget[];
  createdAt: string;
  updatedAt: string;
}
