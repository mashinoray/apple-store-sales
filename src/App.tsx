import { useState, useRef, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './lib/supabase';
// @ts-ignore - recharts类型兼容性问题
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, ShoppingCart, RefreshCw, DollarSign, TrendingUp, TrendingDown,
  Plus, X, Calendar, BarChart3, List, Settings, Apple, XCircle, Upload, FileSpreadsheet, GraduationCap, CalendarDays, Target
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, TRADE_IN_REASON_LABELS, ProductType, CustomerType, PurchaseType, TradeInReason, TRAINING_TASK_LABELS, TrainingTaskType, WeeklyPlan, EmployeeWeeklyTarget } from './types';
import './App.css';

// 颜色配置
const COLORS = {
  primary: '#0071e3',
  primaryDark: '#005bb5',
  success: '#34c759',
  warning: '#ff9500',
  danger: '#ff3b30',
  secondary: '#86868b',
  background: '#f5f5f7',
  surface: '#ffffff',
  textPrimary: '#1d1d1f',
  textSecondary: '#6e6e73',
  border: '#d2d2d7',
};

const CHART_COLORS = ['#0071e3', '#34c759', '#ff9500', '#ff3b30', '#86868b', '#5856d6', '#af52de', '#ff2d55'];

// 页面类型
type PageType = 'dashboard' | 'orders' | 'employees' | 'import' | 'training' | 'weekly_data' | 'weekly_plan';

// 解析Excel文件后的销售记录类型
interface ImportedSale {
  date: string;
  billNo: string;
  store: string;
  salesperson: string;
  category: string;
  productName: string;
  quantity: number;
  amount: number;
  hostType: 'iPhone' | '其他主机' | '非主机';
}

// 员工主机销量统计
interface HostSalesStats {
  salesperson: string;
  iphoneCount: number;
  otherHostCount: number;
  hostTotal: number;
}

// 订单录入弹窗组件
function OrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { employees, addOrder } = useApp();
  const [formData, setFormData] = useState({
    employeeId: '',
    customerName: '',
    customerType: 'new' as CustomerType,
    product: 'iPhone' as ProductType,
    purchaseType: 'full' as PurchaseType,
    installmentMonths: 12 as number | undefined,
    hasTradeIn: false,
    tradeInReason: undefined as TradeInReason | undefined,
    customReason: '',
    amount: 4999,
  });
  const [showReasonModal, setShowReasonModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hasTradeIn && !formData.tradeInReason) {
      setShowReasonModal(true);
      return;
    }

    addOrder({
      ...formData,
      tradeInReason: formData.tradeInReason || undefined,
      date: new Date().toISOString().split('T')[0],
    } as any);

    // 重置表单
    setFormData({
      employeeId: '',
      customerName: '',
      customerType: 'new',
      product: 'iPhone',
      purchaseType: 'full',
      installmentMonths: 12,
      hasTradeIn: false,
      tradeInReason: undefined,
      customReason: '',
      amount: 4999,
    });
    onClose();
  };

  const handleReasonSubmit = () => {
    if (!formData.tradeInReason) return;
    addOrder({
      ...formData,
      date: new Date().toISOString().split('T')[0],
    } as any);

    setFormData({
      employeeId: '',
      customerName: '',
      customerType: 'new',
      product: 'iPhone',
      purchaseType: 'full',
      installmentMonths: 12,
      hasTradeIn: false,
      tradeInReason: undefined,
      customReason: '',
      amount: 4999,
    });
    setShowReasonModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>录入销售订单</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label>选择员工 <span className="required">*</span></label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              required
            >
              <option value="">请选择员工</option>
              {employees.filter(e => e.isActive).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>客户姓名</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              placeholder="请输入客户姓名（选填）"
            />
          </div>

          <div className="form-group">
            <label>客户类型</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="customerType"
                  value="new"
                  checked={formData.customerType === 'new'}
                  onChange={() => setFormData({...formData, customerType: 'new'})}
                />
                <span>新增客户</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="customerType"
                  value="existing"
                  checked={formData.customerType === 'existing'}
                  onChange={() => setFormData({...formData, customerType: 'existing'})}
                />
                <span>老客户</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>购买产品</label>
            <select
              value={formData.product}
              onChange={(e) => setFormData({...formData, product: e.target.value as ProductType})}
            >
              <option value="iPhone">iPhone</option>
              <option value="iPad">iPad</option>
              <option value="Mac">Mac</option>
              <option value="Apple Watch">Apple Watch</option>
              <option value="AirPods">AirPods</option>
              <option value="Other">其他</option>
            </select>
          </div>

          <div className="form-group">
            <label>购买方式</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="purchaseType"
                  value="full"
                  checked={formData.purchaseType === 'full'}
                  onChange={() => setFormData({...formData, purchaseType: 'full'})}
                />
                <span>全款</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="purchaseType"
                  value="installment"
                  checked={formData.purchaseType === 'installment'}
                  onChange={() => setFormData({...formData, purchaseType: 'installment'})}
                />
                <span>分期</span>
              </label>
            </div>
          </div>

          {formData.purchaseType === 'installment' && (
            <div className="form-group">
              <label>分期期数</label>
              <select
                value={formData.installmentMonths}
                onChange={(e) => setFormData({...formData, installmentMonths: Number(e.target.value)})}
              >
                <option value={12}>12期</option>
                <option value={24}>24期</option>
                <option value={36}>36期</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>以旧换新</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasTradeIn"
                  value="true"
                  checked={formData.hasTradeIn === true}
                  onChange={() => setFormData({...formData, hasTradeIn: true, tradeInReason: undefined})}
                />
                <span className="text-success">是</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="hasTradeIn"
                  value="false"
                  checked={formData.hasTradeIn === false}
                  onChange={() => setFormData({...formData, hasTradeIn: false})}
                />
                <span className="text-danger">否</span>
              </label>
            </div>
          </div>

          {!formData.hasTradeIn && (
            <div className="form-hint">
              <XCircle size={16} />
              <span>请选择未成交原因，系统将自动记录</span>
            </div>
          )}

          <button type="submit" className="submit-btn">
            {formData.hasTradeIn ? '提交订单' : '选择未成交原因'}
          </button>
        </form>

        {/* 未成交原因选择弹窗 */}
        {showReasonModal && (
          <div className="reason-modal-overlay">
            <div className="reason-modal">
              <div className="modal-header">
                <h3>请选择未成交原因</h3>
                <button className="close-btn" onClick={() => setShowReasonModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="reason-list">
                {Object.entries(TRADE_IN_REASON_LABELS).map(([key, label]) => (
                  <label key={key} className={`reason-item ${formData.tradeInReason === key ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="tradeInReason"
                      value={key}
                      checked={formData.tradeInReason === key}
                      onChange={() => setFormData({...formData, tradeInReason: key as TradeInReason})}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {formData.tradeInReason === 'other' && (
                <div className="form-group">
                  <input
                    type="text"
                    value={formData.customReason}
                    onChange={(e) => setFormData({...formData, customReason: e.target.value})}
                    placeholder="请输入具体原因"
                    className="custom-reason-input"
                  />
                </div>
              )}
              <button
                className="submit-btn"
                onClick={handleReasonSubmit}
                disabled={!formData.tradeInReason}
              >
                确认提交
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 顶部导航栏
function Navbar({ currentPage, setCurrentPage }: { currentPage: PageType; setCurrentPage: (page: PageType) => void }) {
  const { refreshData, isSyncing, syncError, lastSyncTime } = useApp();
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const formatSyncTime = (time: string | null) => {
    if (!time) return '未同步';
    const date = new Date(time);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo">
          <Apple size={28} />
          <span>Apple项目管理中心</span>
        </div>
      </div>
      <div className="navbar-center">
        <button
          className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('dashboard')}
        >
          <BarChart3 size={18} />
          <span>数据看板</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'orders' ? 'active' : ''}`}
          onClick={() => setCurrentPage('orders')}
        >
          <List size={18} />
          <span>订单管理</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'import' ? 'active' : ''}`}
          onClick={() => setCurrentPage('import')}
        >
          <Upload size={18} />
          <span>导入数据</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'employees' ? 'active' : ''}`}
          onClick={() => setCurrentPage('employees')}
        >
          <Users size={18} />
          <span>员工管理</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'training' ? 'active' : ''}`}
          onClick={() => setCurrentPage('training')}
        >
          <GraduationCap size={18} />
          <span>培训跟进</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'weekly_data' ? 'active' : ''}`}
          onClick={() => setCurrentPage('weekly_data')}
        >
          <CalendarDays size={18} />
          <span>周度看板</span>
        </button>
        <button
          className={`nav-btn ${currentPage === 'weekly_plan' ? 'active' : ''}`}
          onClick={() => setCurrentPage('weekly_plan')}
        >
          <Target size={18} />
          <span>周度计划</span>
        </button>
      </div>
      <div className="navbar-right">
        {/* 云端同步状态 */}
        <div className="sync-status" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
          {isSyncing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0071e3', fontSize: '13px' }}>
              <RefreshCw size={14} className="spin" />
              同步中...
            </span>
          ) : syncError ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff3b30', fontSize: '13px' }}>
              <XCircle size={14} />
              同步异常
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34c759', fontSize: '13px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }}></span>
              云端已连接
            </span>
          )}
          <span style={{ color: '#86868b', fontSize: '12px' }}>
            {formatSyncTime(lastSyncTime)}
          </span>
          <button
            onClick={refreshData}
            disabled={isSyncing}
            style={{
              background: 'none',
              border: 'none',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              padding: '4px',
              opacity: isSyncing ? 0.5 : 1,
            }}
            title="刷新数据"
          >
            <RefreshCw size={14} style={{ color: '#6e6e73' }} />
          </button>
        </div>
        <span className="date-display">{today}</span>
      </div>
    </nav>
  );
}

// 统计卡片组件
function StatCard({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  color: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <span className="stat-title">{title}</span>
        <div className="stat-value-row">
          <span className="stat-value" style={{ color }}>{value}</span>
          {trend && (
            <span className={`stat-trend ${trend}`}>
              {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
          )}
        </div>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

// 员工列表组件
function EmployeeList({ onSelectEmployee }: { onSelectEmployee: (id: string) => void }) {
  const { employees, getEmployeeStats, selectedDate } = useApp();

  return (
    <div className="employee-list">
      <h3>员工列表</h3>
      <div className="employee-cards">
        {employees.filter(e => e.isActive).map(emp => {
          const stats = getEmployeeStats(emp.id, selectedDate);
          return (
            <div
              key={emp.id}
              className="employee-card"
              onClick={() => onSelectEmployee(emp.id)}
            >
              <div className="employee-avatar">
                {emp.name.charAt(0)}
              </div>
              <div className="employee-info">
                <span className="employee-name">{emp.name}</span>
              </div>
              <div className="employee-stats-mini">
                <span className="mini-stat">
                  <ShoppingCart size={14} />
                  {stats.totalOrders}
                </span>
                <span className="mini-stat success">
                  <RefreshCw size={14} />
                  {stats.tradeInCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 数据看板页面
function Dashboard() {
  const { orders, getDailyStats, getAllEmployeeStats, getReasonStats, employees } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 日期范围选择
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // 计算时间段内的统计数据
  const periodOrders = orders.filter(order => {
    const orderDate = order.date;
    return orderDate >= startDate && orderDate <= endDate;
  });

  const periodStats = {
    totalOrders: periodOrders.length,
    tradeInCount: periodOrders.filter(o => o.hasTradeIn).length,
    installmentCount: periodOrders.filter(o => o.purchaseType === 'installment').length,
    iphoneCount: periodOrders.filter(o => o.product === 'iPhone').length,
    otherHostCount: periodOrders.filter(o => ['iPad', 'Mac', 'Apple Watch'].includes(o.product)).length,
    hostTotal: periodOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length,
    // iPhone换新统计
    iphoneTradeInCount: periodOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length,
  };

  periodStats.tradeInRate = periodStats.totalOrders > 0 ? (periodStats.tradeInCount / periodStats.totalOrders) * 100 : 0;
  periodStats.installmentRate = periodStats.totalOrders > 0 ? (periodStats.installmentCount / periodStats.totalOrders) * 100 : 0;
  periodStats.iphoneTradeInRate = periodStats.iphoneCount > 0 ? (periodStats.iphoneTradeInCount / periodStats.iphoneCount) * 100 : 0;
  periodStats.allCategoryTradeInRate = periodStats.hostTotal > 0 ? (periodStats.tradeInCount / periodStats.hostTotal) * 100 : 0;

  // 计算每个员工的销量
  const employeePeriodStats = employees
    .filter(e => e.isActive)
    .map(emp => {
      const empOrders = periodOrders.filter(o => o.employeeId === emp.id);
      const empIphoneCount = empOrders.filter(o => o.product === 'iPhone').length;
      const empHostTotal = empOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length;
      const empTradeInCount = empOrders.filter(o => o.hasTradeIn).length;
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalOrders: empOrders.length,
        iphoneCount: empIphoneCount,
        otherHostCount: empOrders.filter(o => ['iPad', 'Mac', 'Apple Watch'].includes(o.product)).length,
        hostTotal: empHostTotal,
        tradeInCount: empTradeInCount,
        installmentCount: empOrders.filter(o => o.purchaseType === 'installment').length,
        // iPhone换新统计
        iphoneTradeInCount: empOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length,
        iphoneTradeInRate: empIphoneCount > 0 ? (empOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length / empIphoneCount) * 100 : 0,
        // 全品类换新率
        allCategoryTradeInRate: empHostTotal > 0 ? (empTradeInCount / empHostTotal) * 100 : 0,
      };
    })
    .filter(stat => stat.hostTotal > 0) // 只显示有销量的员工
    .sort((a, b) => b.hostTotal - a.hostTotal);

  // 未成交原因统计
  const periodReasonStats = (() => {
    const reasonCounts: Record<TradeInReason, number> = {
      backup_keep: 0, gift: 0, price_compare_lost: 0, model_too_old: 0,
      no_willingness: 0, given_to_family: 0, gap_7: 0, cannot_trade_in: 0,
      process_complex: 0, considering: 0, other: 0,
    };
    const noTradeInOrders = periodOrders.filter(o => !o.hasTradeIn);
    noTradeInOrders.forEach(order => {
      if (order.tradeInReason) {
        reasonCounts[order.tradeInReason]++;
      }
    });
    const total = noTradeInOrders.length;
    return Object.entries(reasonCounts)
      .filter(([_, count]) => count > 0)
      .map(([reason, count]) => ({
        reason: reason as TradeInReason,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  })();

  const reasonChartData = periodReasonStats.map(stat => ({
    name: TRADE_IN_REASON_LABELS[stat.reason].slice(0, 6),
    value: stat.count,
    percentage: stat.percentage.toFixed(1),
  }));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>数据看板</h2>
        <div className="header-actions">
          {/* 日期范围选择 */}
          <div className="date-range-picker" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '14px', color: '#6e6e73' }}>从</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}
            />
            <span style={{ fontSize: '14px', color: '#6e6e73' }}>至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}
            />
          </div>
          <button className="add-order-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            录入订单
          </button>
        </div>
      </div>

      {/* 统计卡片 - 主机销量 */}
      <div className="host-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0071e3' }}>
          <div className="stat-icon" style={{ backgroundColor: '#0071e315', color: '#0071e3' }}>
            <Apple size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-title">iPhone 销量</span>
            <span className="stat-value" style={{ color: '#0071e3', fontSize: '32px', fontWeight: 'bold' }}>{periodStats.iphoneCount}</span>
            <span className="stat-subtitle">台</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #5856d6' }}>
          <div className="stat-icon" style={{ backgroundColor: '#5856d615', color: '#5856d6' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-title">其他主机销量</span>
            <span className="stat-value" style={{ color: '#5856d6', fontSize: '32px', fontWeight: 'bold' }}>{periodStats.otherHostCount}</span>
            <span className="stat-subtitle">iPad/Mac/Watch</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #34c759' }}>
          <div className="stat-icon" style={{ backgroundColor: '#34c75915', color: '#34c759' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-title">主机总销量</span>
            <span className="stat-value" style={{ color: '#34c759', fontSize: '32px', fontWeight: 'bold' }}>{periodStats.hostTotal}</span>
            <span className="stat-subtitle">台</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ff9500' }}>
          <div className="stat-icon" style={{ backgroundColor: '#ff950015', color: '#ff9500' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-title">参与员工</span>
            <span className="stat-value" style={{ color: '#ff9500', fontSize: '32px', fontWeight: 'bold' }}>{employeePeriodStats.length}</span>
            <span className="stat-subtitle">人</span>
          </div>
        </div>
      </div>

      {/* 辅助统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0071e3' }}>
          <div className="stat-content">
            <span className="stat-title">以旧换新</span>
            <span className="stat-value" style={{ color: '#0071e3', fontSize: '24px', fontWeight: 'bold' }}>{periodStats.tradeInRate.toFixed(1)}%</span>
            <span className="stat-subtitle">{periodStats.tradeInCount} 笔</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #5856d6' }}>
          <div className="stat-content">
            <span className="stat-title">分期付款</span>
            <span className="stat-value" style={{ color: '#5856d6', fontSize: '24px', fontWeight: 'bold' }}>{periodStats.installmentRate.toFixed(1)}%</span>
            <span className="stat-subtitle">{periodStats.installmentCount} 笔</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #30d158' }}>
          <div className="stat-content">
            <span className="stat-title">iPhone换新率</span>
            <span className="stat-value" style={{ color: '#30d158', fontSize: '24px', fontWeight: 'bold' }}>{periodStats.iphoneTradeInRate.toFixed(1)}%</span>
            <span className="stat-subtitle">{periodStats.iphoneTradeInCount} / {periodStats.iphoneCount}</span>
          </div>
        </div>
      </div>

      {/* 员工销量明细 */}
      <div className="chart-card" style={{ marginTop: '24px' }}>
        <h3>员工销量明细</h3>
        {employeePeriodStats.length > 0 ? (
          <div className="ranking-table" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>员工姓名</th>
                  <th>iPhone 销量</th>
                  <th>iPhone 换新</th>
                  <th>iPhone换新率</th>
                  <th>全品类换新率</th>
                  <th>其他主机</th>
                  <th>主机总计</th>
                  <th>分期</th>
                </tr>
              </thead>
              <tbody>
                {employeePeriodStats.map((stat, index) => (
                  <tr key={stat.employeeId}>
                    <td>
                      <span className={`rank-badge ${index < 3 ? 'top' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{stat.employeeName}</td>
                    <td style={{ color: '#0071e3', fontWeight: 'bold', fontSize: '16px' }}>{stat.iphoneCount}</td>
                    <td style={{ color: '#30d158', fontWeight: 'bold', fontSize: '16px' }}>{stat.iphoneTradeInCount}</td>
                    <td>
                      <span style={{
                        color: stat.iphoneTradeInRate >= 35 ? '#30d158' : stat.iphoneTradeInRate >= 25 ? '#ff9500' : '#ff3b30',
                        fontWeight: 'bold'
                      }}>
                        {stat.iphoneTradeInRate.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: stat.allCategoryTradeInRate >= 35 ? '#30d158' : stat.allCategoryTradeInRate >= 25 ? '#ff9500' : '#ff3b30',
                        fontWeight: 'bold'
                      }}>
                        {stat.allCategoryTradeInRate.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ color: '#5856d6', fontWeight: 'bold', fontSize: '16px' }}>{stat.otherHostCount}</td>
                    <td style={{ color: '#34c759', fontWeight: 'bold', fontSize: '16px' }}>{stat.hostTotal}</td>
                    <td className="text-warning">{stat.installmentCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f7' }}>
                  <td colSpan={2}>合计</td>
                  <td style={{ color: '#0071e3' }}>{periodStats.iphoneCount}</td>
                  <td style={{ color: '#30d158' }}>{periodStats.iphoneTradeInCount}</td>
                  <td style={{ color: periodStats.iphoneTradeInRate >= 35 ? '#30d158' : periodStats.iphoneTradeInRate >= 25 ? '#ff9500' : '#ff3b30' }}>
                    {periodStats.iphoneTradeInRate.toFixed(1)}%
                  </td>
                  <td style={{ color: periodStats.allCategoryTradeInRate >= 35 ? '#30d158' : periodStats.allCategoryTradeInRate >= 25 ? '#ff9500' : '#ff3b30' }}>
                    {periodStats.allCategoryTradeInRate.toFixed(1)}%
                  </td>
                  <td style={{ color: '#5856d6' }}>{periodStats.otherHostCount}</td>
                  <td style={{ color: '#34c759' }}>{periodStats.hostTotal}</td>
                  <td className="text-warning">{periodStats.installmentCount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6e6e73' }}>
            <ShoppingCart size={48} style={{ opacity: 0.3 }} />
            <p style={{ marginTop: '12px' }}>该时间段暂无销售数据</p>
          </div>
        )}
      </div>

      {/* 未成交原因分析 */}
      {periodReasonStats.length > 0 && (
        <div className="charts-grid" style={{ marginTop: '24px' }}>
          <div className="chart-card">
            <h3>未成交原因分析</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={reasonChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {reasonChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="reason-list">
              {periodReasonStats.map((stat, index) => (
                <div key={stat.reason} className="reason-item">
                  <span className="reason-dot" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                  <span className="reason-label">{TRADE_IN_REASON_LABELS[stat.reason]}</span>
                  <span className="reason-count">{stat.count} 笔</span>
                  <span className="reason-percent">{stat.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <OrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// 订单管理页面
function OrdersPage() {
  const { orders, employees, deleteOrder, updateOrder, selectedDate, setSelectedDate } = useApp();
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editReason, setEditReason] = useState<TradeInReason | undefined>(undefined);
  const [editCustomReason, setEditCustomReason] = useState('');
  const [editHasTradeIn, setEditHasTradeIn] = useState(false);
  const [editIsInstallment, setEditIsInstallment] = useState(false);

  const filteredOrders = orders
    .filter(order => order.date === selectedDate)
    .filter(order => !filterEmployee || order.employeeId === filterEmployee)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 打开编辑弹窗
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditReason(order.tradeInReason);
    setEditCustomReason(order.customReason || '');
    setEditHasTradeIn(order.hasTradeIn);
    setEditIsInstallment(order.purchaseType === 'installment');
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingOrder) return;
    updateOrder(editingOrder.id, {
      hasTradeIn: editHasTradeIn,
      tradeInReason: editHasTradeIn ? undefined : editReason,
      customReason: editReason === 'other' ? editCustomReason : '',
      purchaseType: editIsInstallment ? 'installment' : 'full' as PurchaseType,
    });
    setEditingOrder(null);
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h2>订单管理</h2>
        <div className="header-actions">
          <div className="date-picker">
            <Calendar size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="filter-select"
          >
            <option value="">全部员工</option>
            {employees.filter(e => e.isActive).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <button className="add-order-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            录入订单
          </button>
        </div>
      </div>

      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>员工</th>
              <th>客户</th>
              <th>产品</th>
              <th>购买方式</th>
              <th>以旧换新</th>
              <th>未成交原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const emp = employees.find(e => e.id === order.employeeId);
                return (
                  <tr key={order.id}>
                    <td>{new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{emp?.name}</td>
                    <td>{order.customerName || '-'}</td>
                    <td>{order.product}</td>
                    <td>
                      {order.purchaseType === 'full' ? '全款' : `分期${order.installmentMonths}期`}
                    </td>
                    <td>
                      <span className={`status-badge ${order.hasTradeIn ? 'success' : 'danger'}`}>
                        {order.hasTradeIn ? '是' : '否'}
                      </span>
                    </td>
                    <td>
                      {!order.hasTradeIn && order.tradeInReason
                        ? <span
                            style={{ cursor: 'pointer', color: COLORS.primary }}
                            onClick={() => handleEditOrder(order)}
                          >
                            {TRADE_IN_REASON_LABELS[order.tradeInReason]}
                            <Settings size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                          </span>
                        : order.hasTradeIn
                        ? '-'
                        : <span
                            style={{ cursor: 'pointer', color: COLORS.danger }}
                            onClick={() => handleEditOrder(order)}
                          >
                            待补充
                            <Settings size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                          </span>
                      }
                    </td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditOrder(order)}
                        title="编辑"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteOrder(order.id)}
                        title="删除"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <ShoppingCart size={32} />
                  <p>暂无订单记录</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* 编辑订单弹窗 */}
      {editingOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>编辑订单</h2>
              <button className="close-btn" onClick={() => setEditingOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="order-edit-info" style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f7', borderRadius: '8px' }}>
              <p><strong>员工：</strong>{employees.find(e => e.id === editingOrder.employeeId)?.name}</p>
              <p><strong>产品：</strong>{editingOrder.product}</p>
              <p><strong>金额：</strong>¥{editingOrder.amount?.toLocaleString()}</p>
            </div>

            <div className="form-group">
              <label>以旧换新</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="editHasTradeIn"
                    value="true"
                    checked={editHasTradeIn === true}
                    onChange={() => setEditHasTradeIn(true)}
                  />
                  <span className="text-success">是</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="editHasTradeIn"
                    value="false"
                    checked={editHasTradeIn === false}
                    onChange={() => setEditHasTradeIn(false)}
                  />
                  <span className="text-danger">否</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>购买方式</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="editIsInstallment"
                    value="false"
                    checked={editIsInstallment === false}
                    onChange={() => setEditIsInstallment(false)}
                  />
                  <span>全款</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="editIsInstallment"
                    value="true"
                    checked={editIsInstallment === true}
                    onChange={() => setEditIsInstallment(true)}
                  />
                  <span>分期</span>
                </label>
              </div>
            </div>

            {!editHasTradeIn && (
              <div className="form-group">
                <label>未成交原因</label>
                <div className="reason-list">
                  {Object.entries(TRADE_IN_REASON_LABELS).map(([key, label]) => (
                    <label key={key} className={`reason-item ${editReason === key ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="editReason"
                        value={key}
                        checked={editReason === key}
                        onChange={() => setEditReason(key as TradeInReason)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {editReason === 'other' && (
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      value={editCustomReason}
                      onChange={(e) => setEditCustomReason(e.target.value)}
                      placeholder="请输入具体原因"
                      className="custom-reason-input"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              className="submit-btn"
              onClick={handleSaveEdit}
              disabled={!editHasTradeIn && !editReason}
            >
              保存修改
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 数据导入页面
function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { employees, addEmployee, importOrders, setSelectedDate } = useApp();
  const [importedData, setImportedData] = useState<ImportedSale[]>([]);
  const [stats, setStats] = useState<HostSalesStats[]>([]);
  const [dateRange, setDateRange] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState(false);

  // 解析Excel文件
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 将sheet转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        // 解析数据
        const sales: ImportedSale[] = [];

        // 智能检测表头行并确定列位置
        let headerRowIndex = -1;
        let colMap: { [key: string]: number } = {};

        // 扫描前30行查找表头行
        for (let i = 0; i < Math.min(30, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row || row.length < 5) continue;

          // 扫描这一行的所有单元格，查找表头关键词
          const foundCols: string[] = [];
          for (let j = 0; j < row.length; j++) {
            const header = String(row[j] || '').trim();

            if (header.includes('单据日期') || header === '日期') {
              colMap['date'] = j;
              foundCols.push('date');
            } else if (header.includes('单据编号') || header === '编号') {
              colMap['billNo'] = j;
            } else if (header.includes('门店名称') || header.includes('门店')) {
              colMap['store'] = j;
              foundCols.push('store');
            } else if (header.includes('导购名称') || header.includes('导购') || header.includes('销售员') || header.includes('销售人员')) {
              colMap['salesperson'] = j;
              foundCols.push('salesperson');
            } else if (header.includes('存货分类') || header.includes('产品分类') || header.includes('分类')) {
              colMap['category'] = j;
              foundCols.push('category');
            } else if (header.includes('存货名称') || header.includes('商品名称') || header.includes('产品名称')) {
              colMap['productName'] = j;
            } else if (header.includes('数量') || header.includes('件数')) {
              colMap['quantity'] = j;
            } else if (header.includes('零售金额') || header.includes('售价') || header === '金额') {
              colMap['amount'] = j;
              foundCols.push('amount');
            }
          }

          // 如果这一行包含至少4个关键表头，认为是表头行
          if (foundCols.length >= 4) {
            headerRowIndex = i;
            console.log('智能检测到表头行:', i, '列映射:', colMap);
            break;
          }
        }

        // 如果智能检测失败，使用默认列位置（根据标准格式）
        if (headerRowIndex === -1 || !colMap['salesperson']) {
          console.log('智能检测失败，使用默认列位置');
          colMap = {
            date: 1,
            billNo: 2,
            store: 3,
            salesperson: 4,
            category: 5,
            productName: 7,
            quantity: 8,
            amount: 9
          };
          headerRowIndex = 6;
        }

        console.log('最终使用的列映射:', colMap);

        // 从表头行之后开始读取数据
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 5) continue;

          const billNo = colMap.billNo !== undefined ? row[colMap.billNo] : undefined;
          const category = colMap.category !== undefined ? row[colMap.category] : undefined;

          // 跳过小计行和空行
          if (!billNo || String(billNo) === '单据编号' || (typeof category === 'string' && category.includes('小计'))) {
            continue;
          }

          const date = colMap.date !== undefined ? row[colMap.date] : undefined;
          const store = colMap.store !== undefined ? row[colMap.store] : undefined;
          const salesperson = colMap.salesperson !== undefined ? row[colMap.salesperson] : undefined;
          const productName = colMap.productName !== undefined ? row[colMap.productName] : undefined;
          const quantity = colMap.quantity !== undefined ? (row[colMap.quantity] || 1) : 1;
          const amount = colMap.amount !== undefined ? (row[colMap.amount] || 0) : 0;

          // 判断主机类型
          let hostType: 'iPhone' | '其他主机' | '非主机' = '非主机';
          if (category) {
            const catStr = String(category).toUpperCase();
            if (catStr.includes('IPHONE')) {
              hostType = 'iPhone';
            } else if (catStr.includes('IPAD') || catStr.includes('MAC') || catStr.includes('WATCH')) {
              hostType = '其他主机';
            }
          }

          if (hostType !== '非主机') {
            // 格式化日期
            let formattedDate = '';
            if (date) {
              if (typeof date === 'number') {
                // Excel日期序列号
                const excelDate = new Date((date - 25569) * 86400 * 1000);
                formattedDate = excelDate.toISOString().split('T')[0];
              } else {
                const dateStr = String(date);
                if (dateStr.includes('-')) {
                  formattedDate = dateStr.split('T')[0];
                } else if (dateStr.includes('.')) {
                  formattedDate = dateStr.replace(/\./g, '-');
                } else {
                  formattedDate = dateStr;
                }
              }
            }

            sales.push({
              date: formattedDate,
              billNo: String(billNo),
              store: String(store || ''),
              salesperson: String(salesperson || ''),
              category: String(category || ''),
              productName: String(productName || ''),
              quantity: Number(quantity),
              amount: Number(amount),
              hostType,
            });
          }
        }

        // 按销售人员汇总
        const salesMap = new Map<string, { iphone: number; other: number; total: number }>();

        sales.forEach(sale => {
          const existing = salesMap.get(sale.salesperson) || { iphone: 0, other: 0, total: 0 };
          if (sale.hostType === 'iPhone') {
            existing.iphone += sale.quantity;
          } else if (sale.hostType === '其他主机') {
            existing.other += sale.quantity;
          }
          existing.total += sale.quantity;
          salesMap.set(sale.salesperson, existing);
        });

        const statsArray: HostSalesStats[] = Array.from(salesMap.entries())
          .map(([name, counts]) => ({
            salesperson: name,
            iphoneCount: counts.iphone,
            otherHostCount: counts.other,
            hostTotal: counts.total,
          }))
          .sort((a, b) => b.hostTotal - a.hostTotal);

        setImportedData(sales);
        setStats(statsArray);

        // 提取日期范围
        const dates = [...new Set(sales.map(s => s.date))].filter(d => d);
        if (dates.length > 0) {
          setDateRange(`${dates[0]} - ${dates[dates.length - 1]}`);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('解析错误:', err);
        setError('文件解析失败，请确保上传正确的零售职员销售统计Excel文件');
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('文件读取失败');
      setIsLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // 触发文件选择
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 清除数据
  const handleClear = () => {
    setImportedData([]);
    setStats([]);
    setDateRange('');
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 同步到订单管理
  const handleSyncToOrders = () => {
    // 首先收集所有需要创建的新员工（去重）
    const newEmployeeNames = new Set<string>();
    
    importedData.forEach(sale => {
      const salespersonName = sale.salesperson.trim();
      if (!salespersonName) return;
      
      // 检查是否已存在
      const exists = employees.some(e => 
        e.name === salespersonName ||
        e.name.includes(salespersonName) ||
        salespersonName.includes(e.name)
      );
      
      if (!exists) {
        newEmployeeNames.add(salespersonName);
      }
    });

    // 创建一个映射：新员工名字 -> 新员工ID
    const newEmployeeMap = new Map<string, string>();
    
    // 批量创建新员工
    newEmployeeNames.forEach(name => {
      const newId = Math.random().toString(36).substr(2, 9);
      newEmployeeMap.set(name, newId);
      
      // 直接添加到supabase（同步执行）
      supabase.from('employees').insert({
        id: newId,
        name: name,
        employee_id: 'IMP' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        position: '销售顾问',
        is_active: true
      }).then(({ error }) => {
        if (error) console.error('创建员工失败:', error);
      });
    });

    // 将新创建的员工也添加到本地状态
    const newEmployees = Array.from(newEmployeeMap.entries()).map(([name, id]) => ({
      id,
      name,
      employeeId: 'IMP' + id.substring(0, 6).toUpperCase(),
      position: '销售顾问',
      isActive: true
    }));
    
    if (newEmployees.length > 0) {
      // 需要更新本地employees状态
      const updatedEmployees = [...employees, ...newEmployees];
      // 注意：这里需要通知AppContext更新，但由于我们直接操作了supabase，
      // AppContext会通过refreshData或下次加载时同步
    }

    // 将导入的数据转换为订单格式
    const ordersToImport = importedData.map(sale => {
      let matchedEmployeeId = '';
      const salespersonName = sale.salesperson.trim();

      if (!salespersonName) {
        // 没有销售人员名称，跳过
        return null;
      }

      // 首先尝试精确匹配现有员工
      let matchedEmp = employees.find(e => e.name === salespersonName);
      if (matchedEmp) {
        matchedEmployeeId = matchedEmp.id;
      } else {
        // 尝试模糊匹配
        matchedEmp = employees.find(e =>
          salespersonName.includes(e.name) || e.name.includes(salespersonName)
        );
        if (matchedEmp) {
          matchedEmployeeId = matchedEmp.id;
        } else {
          // 使用之前创建的新员工映射
          matchedEmployeeId = newEmployeeMap.get(salespersonName) || '';
        }
      }

      if (!matchedEmployeeId) {
        return null; // 跳过无法匹配员工的订单
      }

      // 确定产品类型
      let productType: ProductType = 'iPhone';
      if (sale.hostType === 'iPhone') {
        productType = 'iPhone';
      } else if (sale.category.toUpperCase().includes('IPAD')) {
        productType = 'iPad';
      } else if (sale.category.toUpperCase().includes('MAC')) {
        productType = 'Mac';
      } else if (sale.category.toUpperCase().includes('WATCH')) {
        productType = 'Apple Watch';
      }

      return {
        employeeId: matchedEmployeeId,
        customerName: sale.store || undefined,
        customerType: 'new' as CustomerType,
        product: productType,
        purchaseType: 'full' as PurchaseType,
        hasTradeIn: false,
        tradeInReason: undefined,
        customReason: '',
        amount: sale.amount,
        date: sale.date,
      };
    }).filter(Boolean);

    if (ordersToImport.length > 0) {
      importOrders(ordersToImport as any);
      setImportSuccess(true);
      // 自动切换到导入数据的日期
      if (ordersToImport[0]?.date) {
        setSelectedDate(ordersToImport[0].date);
      }
      alert(`成功导入 ${ordersToImport.length} 条订单到管理系统！\n\n已自动切换到数据日期查看。\n以旧换新信息需要在订单管理中手动补充。`);
    }
  };

  // 计算总计
  const totalIphone = stats.reduce((sum, s) => sum + s.iphoneCount, 0);
  const totalOther = stats.reduce((sum, s) => sum + s.otherHostCount, 0);
  const totalHost = stats.reduce((sum, s) => sum + s.hostTotal, 0);

  return (
    <div className="import-page">
      <div className="page-header">
        <h2>导入数据</h2>
        <div className="header-actions">
          <button className="add-order-btn" onClick={handleUploadClick} disabled={isLoading}>
            <Upload size={18} />
            {isLoading ? '解析中...' : '上传Excel文件'}
          </button>
          {importedData.length > 0 && !importSuccess && (
            <button className="add-order-btn" onClick={handleSyncToOrders} style={{ backgroundColor: COLORS.success }}>
              <ShoppingCart size={18} />
              同步到订单管理
            </button>
          )}
          {importSuccess && (
            <button
              className="add-order-btn"
              onClick={() => {
                const navBtns = document.querySelectorAll('.nav-btn');
                navBtns[1]?.click(); // 点击订单管理
              }}
              style={{ backgroundColor: COLORS.success }}
            >
              <List size={18} />
              查看订单
            </button>
          )}
          {importedData.length > 0 && (
            <button className="add-order-btn" onClick={handleClear} style={{ backgroundColor: COLORS.danger }}>
              <X size={18} />
              清除数据
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div className="error-message" style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {importedData.length === 0 ? (
        <div className="upload-area" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          backgroundColor: COLORS.surface,
          borderRadius: '12px',
          border: '2px dashed #d2d2d7',
          marginTop: '20px'
        }}>
          <FileSpreadsheet size={64} color={COLORS.secondary} />
          <h3 style={{ marginTop: '20px', color: COLORS.textPrimary }}>上传零售职员销售统计Excel</h3>
          <p style={{ color: COLORS.textSecondary, marginTop: '8px', textAlign: 'center', maxWidth: '400px' }}>
            请上传从系统导出的"零售职员销售统计"Excel文件，系统将自动识别并统计主机销量
          </p>
          <button
            className="submit-btn"
            onClick={handleUploadClick}
            style={{ marginTop: '24px' }}
          >
            <Upload size={18} />
            选择文件
          </button>
        </div>
      ) : (
        <div className="import-results">
          {/* 统计卡片 */}
          <div className="host-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
            <div className="stat-card" style={{ borderLeft: '4px solid #0071e3' }}>
              <div className="stat-icon" style={{ backgroundColor: '#0071e315', color: '#0071e3' }}>
                <Apple size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-title">iPhone 销量</span>
                <span className="stat-value" style={{ color: '#0071e3', fontSize: '28px', fontWeight: 'bold' }}>{totalIphone}</span>
                <span className="stat-subtitle">台</span>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #5856d6' }}>
              <div className="stat-icon" style={{ backgroundColor: '#5856d615', color: '#5856d6' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-title">其他主机销量</span>
                <span className="stat-value" style={{ color: '#5856d6', fontSize: '28px', fontWeight: 'bold' }}>{totalOther}</span>
                <span className="stat-subtitle">iPad/Mac/Watch</span>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #34c759' }}>
              <div className="stat-icon" style={{ backgroundColor: '#34c75915', color: '#34c759' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-title">主机总销量</span>
                <span className="stat-value" style={{ color: '#34c759', fontSize: '28px', fontWeight: 'bold' }}>{totalHost}</span>
                <span className="stat-subtitle">台</span>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #ff9500' }}>
              <div className="stat-icon" style={{ backgroundColor: '#ff950015', color: '#ff9500' }}>
                <Users size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-title">参与员工</span>
                <span className="stat-value" style={{ color: '#ff9500', fontSize: '28px', fontWeight: 'bold' }}>{stats.length}</span>
                <span className="stat-subtitle">人</span>
              </div>
            </div>
          </div>

          {/* 日期范围 */}
          {dateRange && (
            <div style={{ marginTop: '16px', color: COLORS.textSecondary }}>
              <Calendar size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              统计日期：{dateRange}
            </div>
          )}

          {/* 员工销量排名表格 */}
          <div className="ranking-table" style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>按销售人员统计</h3>
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>销售人员</th>
                  <th>iPhone销量</th>
                  <th>其他主机销量</th>
                  <th>主机总计</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={stat.salesperson}>
                    <td>
                      <span className={`rank-badge ${index < 3 ? 'top' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>{stat.salesperson}</td>
                    <td style={{ color: '#0071e3', fontWeight: 'bold' }}>{stat.iphoneCount}</td>
                    <td style={{ color: '#5856d6', fontWeight: 'bold' }}>{stat.otherHostCount}</td>
                    <td style={{ color: '#34c759', fontWeight: 'bold' }}>{stat.hostTotal}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e3EDF7' }}>
                  <td colSpan={2}>合计</td>
                  <td style={{ color: '#0071e3' }}>{totalIphone}</td>
                  <td style={{ color: '#5856d6' }}>{totalOther}</td>
                  <td style={{ color: '#34c759' }}>{totalHost}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 销售明细 */}
          <div className="ranking-table" style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>销售明细</h3>
            <table>
              <thead>
                <tr>
                  <th>销售人员</th>
                  <th>门店</th>
                  <th>产品分类</th>
                  <th>产品名称</th>
                  <th>数量</th>
                  <th>金额</th>
                  <th>主机类型</th>
                </tr>
              </thead>
              <tbody>
                {importedData.slice(0, 50).map((sale, index) => (
                  <tr key={index}>
                    <td>{sale.salesperson}</td>
                    <td>{sale.store}</td>
                    <td>{sale.category}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.productName}</td>
                    <td>{sale.quantity}</td>
                    <td>¥{sale.amount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${sale.hostType === 'iPhone' ? 'primary' : 'secondary'}`}
                        style={{
                          backgroundColor: sale.hostType === 'iPhone' ? '#0071e315' : '#5856d615',
                          color: sale.hostType === 'iPhone' ? '#0071e3' : '#5856d6'
                        }}
                      >
                        {sale.hostType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {importedData.length > 50 && (
              <p style={{ marginTop: '12px', color: COLORS.textSecondary, textAlign: 'center' }}>
                显示前50条记录，共{importedData.length}条
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 培训跟进情况看板页面
function TrainingPage() {
  const { employees, weeklyTrainings, getWeeklyTraining, updateEmployeeTaskCompletion } = useApp();

  // 获取本周日作为默认选中周开始（周日开始，周六结束）
  const getSunday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // 周日作为周开始 (day = 0)
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const [selectedWeekStart, setSelectedWeekStart] = useState(getSunday(new Date()));

  // 获取选中周的培训数据
  const currentWeekTraining = getWeeklyTraining(selectedWeekStart);

  // 获取任务类型列表
  const taskTypes: TrainingTaskType[] = ['seed_active', 'zhi_niao', 'live_stream', 'exam', 'mini_program', 'da_da_le'];

  // 计算本周完成情况统计
  const weekStats = taskTypes.map(taskType => {
    const completedCount = employees.filter(e => e.isActive).filter(emp => {
      const tasks = currentWeekTraining?.tasks[emp.id] || [];
      const task = tasks.find(t => t.taskType === taskType);
      return task?.completed;
    }).length;
    const totalCount = employees.filter(e => e.isActive).length;
    return {
      taskType,
      completedCount,
      totalCount,
      rate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    };
  });

  // 处理勾选变更
  const handleTaskToggle = (employeeId: string, taskType: TrainingTaskType, currentCompleted: boolean) => {
    updateEmployeeTaskCompletion(selectedWeekStart, employeeId, taskType, !currentCompleted);
  };

  // 获取员工作业状态
  const getTaskStatus = (employeeId: string, taskType: TrainingTaskType): boolean => {
    const tasks = currentWeekTraining?.tasks[employeeId] || [];
    const task = tasks.find(t => t.taskType === taskType);
    return task?.completed || false;
  };

  // 周选择器：生成最近8周的选择（周日到周六）
  const weekOptions = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    const sunday = getSunday(date);
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    return {
      value: sunday,
      label: `${sunday} ~ ${saturday.toISOString().split('T')[0]}`,
      displayLabel: `${sunday}`,
    };
  });

  // 筛选活跃员工
  const activeEmployees = employees.filter(e => e.isActive);

  // 计算总体完成率
  const totalCompleted = weekStats.reduce((sum, s) => sum + s.completedCount, 0);
  const totalTasks = weekStats.reduce((sum, s) => sum + s.totalCount, 0);
  const overallRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

  return (
    <div className="training-page">
      <div className="page-header">
        <h2>培训跟进情况看板</h2>
        <div className="header-actions">
          <div className="date-picker">
            <Calendar size={18} />
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}
            >
              {weekOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 周度完成情况概览 */}
      <div className="training-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0071e3', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0071e3' }}>{overallRate.toFixed(0)}%</div>
          <div style={{ color: '#6e6e73', marginTop: '8px' }}>本周整体完成率</div>
          <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>{totalCompleted}/{totalTasks} 任务项</div>
        </div>

        {weekStats.map(stat => (
          <div
            key={stat.taskType}
            className="stat-card"
            style={{
              borderLeft: `4px solid ${stat.rate >= 100 ? '#34c759' : stat.rate >= 50 ? '#ff9500' : '#ff3b30'}`,
              textAlign: 'center',
              padding: '16px'
            }}
          >
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: stat.rate >= 100 ? '#34c759' : stat.rate >= 50 ? '#ff9500' : '#ff3b30'
            }}>
              {stat.rate.toFixed(0)}%
            </div>
            <div style={{ color: '#1d1d1f', marginTop: '8px', fontWeight: '500' }}>
              {TRAINING_TASK_LABELS[stat.taskType]}
            </div>
            <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
              {stat.completedCount}/{stat.totalCount} 人完成
            </div>
          </div>
        ))}
      </div>

      {/* 员工任务明细表 */}
      <div className="training-detail-card" style={{ marginTop: '24px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginBottom: '16px' }}>员工任务完成明细</h3>
        <div className="training-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="training-table">
            <thead>
              <tr>
                <th style={{ minWidth: '100px' }}>员工姓名</th>
                {taskTypes.map(taskType => (
                  <th key={taskType} style={{ minWidth: '100px', textAlign: 'center' }}>
                    {TRAINING_TASK_LABELS[taskType]}
                  </th>
                ))}
                <th style={{ minWidth: '80px', textAlign: 'center' }}>完成率</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.length > 0 ? (
                activeEmployees.map(emp => {
                  const empTasks = taskTypes.map(taskType => ({
                    taskType,
                    completed: getTaskStatus(emp.id, taskType),
                  }));
                  const empCompleted = empTasks.filter(t => t.completed).length;
                  const empRate = (empCompleted / taskTypes.length) * 100;

                  return (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: '600' }}>{emp.name}</td>
                      {empTasks.map(({ taskType, completed }) => (
                        <td key={taskType} style={{ textAlign: 'center' }}>
                          <label className="training-checkbox-label">
                            <input
                              type="checkbox"
                              checked={completed}
                              onChange={() => handleTaskToggle(emp.id, taskType, completed)}
                              className="training-checkbox"
                            />
                            <span className={`training-checkmark ${completed ? 'checked' : ''}`}>
                              {completed && (
                                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                  <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                          </label>
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 'bold',
                          color: empRate === 100 ? '#34c759' : empRate >= 50 ? '#ff9500' : '#ff3b30',
                        }}>
                          {empRate.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={taskTypes.length + 3} style={{ textAlign: 'center', padding: '40px', color: '#6e6e73' }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>暂无员工数据</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 说明提示 */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f7', borderRadius: '8px', color: '#6e6e73', fontSize: '13px' }}>
        <p><strong>使用说明：</strong></p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>选择周次后，点击单元格中的复选框即可标记该员工该任务的完成状态</li>
          <li>数据会自动同步到云端保存</li>
          <li>每项任务默认以周为单位进行统计，新一周开始时数据会自动刷新</li>
        </ul>
      </div>
    </div>
  );
}

// 周度数据看板页面
function WeeklyDataPage() {
  const { employees, orders } = useApp();

  // 获取本周日作为默认选中周开始（周日开始，周六结束）
  const getSunday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  // 获取上周的周日
  const getLastWeekSunday = (sunday: string) => {
    const d = new Date(sunday);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  };

  const [selectedWeekStart, setSelectedWeekStart] = useState(getSunday(new Date()));

  // 周选择器：生成最近12周的选择
  const weekOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    const sunday = getSunday(date);
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    return {
      value: sunday,
      label: `${sunday} ~ ${saturday.toISOString().split('T')[0]}`,
    };
  });

  // 筛选活跃的销售顾问（排除店长和副店长）
  const activeConsultants = employees.filter(e => e.isActive && e.position === '销售顾问');

  // 获取指定日期区间的订单
  const getOrdersInRange = (startDate: string, endDate: string) => {
    return orders.filter(order => order.date >= startDate && order.date <= endDate);
  };

  // 计算员工在某周的数据
  const getEmployeeWeekStats = (employeeId: string, weekStart: string) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const weekOrders = getOrdersInRange(weekStart, weekEndStr).filter(o => o.employeeId === employeeId);
    const iphoneCount = weekOrders.filter(o => o.product === 'iPhone').length;
    const iphoneTradeInCount = weekOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length;
    const hostTotal = weekOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length;
    const tradeInCount = weekOrders.filter(o => o.hasTradeIn).length;
    // 分期数据统计
    const installmentCount = weekOrders.filter(o => o.purchaseType === 'installment').length;

    return {
      iphoneCount,
      iphoneTradeInCount,
      iphoneTradeInRate: iphoneCount > 0 ? (iphoneTradeInCount / iphoneCount) * 100 : 0,
      hostTotal,
      tradeInCount,
      allCategoryTradeInRate: hostTotal > 0 ? (tradeInCount / hostTotal) * 100 : 0,
      installmentCount,
      installmentRate: hostTotal > 0 ? (installmentCount / hostTotal) * 100 : 0,
    };
  };

  // 计算本周和上周的数据（仅销售顾问）
  const employeeStats = activeConsultants.map(emp => {
    const currentWeekStats = getEmployeeWeekStats(emp.id, selectedWeekStart);
    const lastWeekSunday = getLastWeekSunday(selectedWeekStart);
    const lastWeekStats = getEmployeeWeekStats(emp.id, lastWeekSunday);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      currentWeek: currentWeekStats,
      lastWeek: lastWeekStats,
      // 环比变化
      iphoneTradeInRateChange: currentWeekStats.iphoneTradeInRate - lastWeekStats.iphoneTradeInRate,
      allCategoryTradeInRateChange: currentWeekStats.allCategoryTradeInRate - lastWeekStats.allCategoryTradeInRate,
      installmentRateChange: currentWeekStats.installmentRate - lastWeekStats.installmentRate,
    };
  });

  // 计算本周总计
  const weekEnd = new Date(selectedWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  const currentWeekOrders = getOrdersInRange(selectedWeekStart, weekEndStr);
  const lastWeekSunday = getLastWeekSunday(selectedWeekStart);
  const lastWeekEnd = new Date(lastWeekSunday);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
  const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0];
  const lastWeekOrders = getOrdersInRange(lastWeekSunday, lastWeekEndStr);

  const totalCurrentWeek = {
    iphoneCount: currentWeekOrders.filter(o => o.product === 'iPhone').length,
    iphoneTradeInCount: currentWeekOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length,
    hostTotal: currentWeekOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length,
    tradeInCount: currentWeekOrders.filter(o => o.hasTradeIn).length,
    installmentCount: currentWeekOrders.filter(o => o.purchaseType === 'installment').length,
  };
  totalCurrentWeek.iphoneTradeInRate = totalCurrentWeek.iphoneCount > 0 ? (totalCurrentWeek.iphoneTradeInCount / totalCurrentWeek.iphoneCount) * 100 : 0;
  totalCurrentWeek.allCategoryTradeInRate = totalCurrentWeek.hostTotal > 0 ? (totalCurrentWeek.tradeInCount / totalCurrentWeek.hostTotal) * 100 : 0;
  totalCurrentWeek.installmentRate = totalCurrentWeek.hostTotal > 0 ? (totalCurrentWeek.installmentCount / totalCurrentWeek.hostTotal) * 100 : 0;

  const totalLastWeek = {
    iphoneCount: lastWeekOrders.filter(o => o.product === 'iPhone').length,
    iphoneTradeInCount: lastWeekOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length,
    hostTotal: lastWeekOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length,
    tradeInCount: lastWeekOrders.filter(o => o.hasTradeIn).length,
    installmentCount: lastWeekOrders.filter(o => o.purchaseType === 'installment').length,
  };
  totalLastWeek.iphoneTradeInRate = totalLastWeek.iphoneCount > 0 ? (totalLastWeek.iphoneTradeInCount / totalLastWeek.iphoneCount) * 100 : 0;
  totalLastWeek.allCategoryTradeInRate = totalLastWeek.hostTotal > 0 ? (totalLastWeek.tradeInCount / totalLastWeek.hostTotal) * 100 : 0;
  totalLastWeek.installmentRate = totalLastWeek.hostTotal > 0 ? (totalLastWeek.installmentCount / totalLastWeek.hostTotal) * 100 : 0;

  // 格式化变化值显示
  const formatChange = (change: number) => {
    if (change > 0) return `+${change.toFixed(2)}%`;
    if (change < 0) return `${change.toFixed(2)}%`;
    return '0.00%';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#34c759'; // 绿色表示上升
    if (change < 0) return '#ff3b30'; // 红色表示下降
    return '#86868b'; // 灰色表示持平
  };

  return (
    <div className="weekly-data-page">
      <div className="page-header">
        <h2>周度数据看板</h2>
        <div className="header-actions">
          <div className="date-picker">
            <Calendar size={18} />
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}
            >
              {weekOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 本周总体概览 - 第一行 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #0071e3', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#0071e3' }}>{totalCurrentWeek.iphoneCount}</span>
            <span style={{ color: '#6e6e73', fontSize: '14px' }}>台</span>
          </div>
          <div style={{ color: '#6e6e73', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>iPhone 销量</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #30d158', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#30d158' }}>{totalCurrentWeek.iphoneTradeInRate.toFixed(2)}%</span>
            <span style={{ fontSize: '13px', color: getChangeColor(totalCurrentWeek.iphoneTradeInRate - totalLastWeek.iphoneTradeInRate), fontWeight: '600' }}>
              {formatChange(totalCurrentWeek.iphoneTradeInRate - totalLastWeek.iphoneTradeInRate)}
            </span>
          </div>
          <div style={{ color: '#6e6e73', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>iPhone 换新率</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #34c759', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#34c759' }}>{totalCurrentWeek.hostTotal}</span>
            <span style={{ color: '#6e6e73', fontSize: '14px' }}>台</span>
          </div>
          <div style={{ color: '#6e6e73', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>主机总销量</div>
        </div>
      </div>

      {/* 本周总体概览 - 第二行 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #ff9500', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff9500' }}>{totalCurrentWeek.allCategoryTradeInRate.toFixed(2)}%</span>
            <span style={{ fontSize: '13px', color: getChangeColor(totalCurrentWeek.allCategoryTradeInRate - totalLastWeek.allCategoryTradeInRate), fontWeight: '600' }}>
              {formatChange(totalCurrentWeek.allCategoryTradeInRate - totalLastWeek.allCategoryTradeInRate)}
            </span>
          </div>
          <div style={{ color: '#6e6e73', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>全品类换新率</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #af52de', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#af52de' }}>{totalCurrentWeek.installmentCount}</span>
            <span style={{ color: '#6e6e73', fontSize: '14px' }}>笔</span>
          </div>
          <div style={{ color: '#6e6e73', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>分期笔数</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #af52de', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#af52de' }}>{totalCurrentWeek.installmentRate.toFixed(2)}%</span>
            <span style={{ fontSize: '13px', color: getChangeColor(totalCurrentWeek.installmentRate - totalLastWeek.installmentRate), fontWeight: '600' }}>
              {formatChange(totalCurrentWeek.installmentRate - totalLastWeek.installmentRate)}
            </span>
          </div>
          <div style={{ color: '#6e6e73', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>分期率</div>
        </div>
      </div>

      {/* 员工周度数据明细表 */}
      <div className="weekly-detail-card" style={{ marginTop: '24px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ marginBottom: '16px' }}>员工周度数据明细</h3>
        <div className="weekly-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="weekly-table">
            <thead>
              <tr>
                <th style={{ minWidth: '100px' }}>员工</th>
                <th style={{ minWidth: '70px', textAlign: 'right' }}>iPhone销量</th>
                <th style={{ minWidth: '70px', textAlign: 'right' }}>iPhone换新</th>
                <th style={{ minWidth: '120px', textAlign: 'right' }}>
                  <div>iPhone换新率</div>
                  <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#86868b' }}>环比</div>
                </th>
                <th style={{ minWidth: '70px', textAlign: 'right' }}>主机销量</th>
                <th style={{ minWidth: '70px', textAlign: 'right' }}>全品类换新</th>
                <th style={{ minWidth: '120px', textAlign: 'right' }}>
                  <div>全品类换新率</div>
                  <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#86868b' }}>环比</div>
                </th>
                <th style={{ minWidth: '60px', textAlign: 'right' }}>分期</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.length > 0 ? (
                employeeStats.map(stat => (
                  <tr key={stat.employeeId}>
                    <td style={{ fontWeight: '600' }}>{stat.employeeName}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{stat.currentWeek.iphoneCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{stat.currentWeek.iphoneTradeInCount}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: stat.currentWeek.iphoneTradeInRate >= 35 ? '#30d158' : stat.currentWeek.iphoneTradeInRate >= 25 ? '#ff9500' : '#ff3b30' }}>
                        {stat.currentWeek.iphoneTradeInRate.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '11px', color: getChangeColor(stat.iphoneTradeInRateChange) }}>
                        {stat.iphoneTradeInRateChange > 0 ? '▲' : stat.iphoneTradeInRateChange < 0 ? '▼' : '-'} {Math.abs(stat.iphoneTradeInRateChange).toFixed(2)}%
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{stat.currentWeek.hostTotal}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{stat.currentWeek.tradeInCount}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: stat.currentWeek.allCategoryTradeInRate >= 35 ? '#30d158' : stat.currentWeek.allCategoryTradeInRate >= 25 ? '#ff9500' : '#ff3b30' }}>
                        {stat.currentWeek.allCategoryTradeInRate.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '11px', color: getChangeColor(stat.allCategoryTradeInRateChange) }}>
                        {stat.allCategoryTradeInRateChange > 0 ? '▲' : stat.allCategoryTradeInRateChange < 0 ? '▼' : '-'} {Math.abs(stat.allCategoryTradeInRateChange).toFixed(2)}%
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{stat.currentWeek.installmentCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6e6e73' }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>暂无员工数据</p>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f7' }}>
                <td>合计</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totalCurrentWeek.iphoneCount}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totalCurrentWeek.iphoneTradeInCount}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: totalCurrentWeek.iphoneTradeInRate >= 35 ? '#30d158' : totalCurrentWeek.iphoneTradeInRate >= 25 ? '#ff9500' : '#ff3b30' }}>
                    {totalCurrentWeek.iphoneTradeInRate.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '11px', color: getChangeColor(totalCurrentWeek.iphoneTradeInRate - totalLastWeek.iphoneTradeInRate) }}>
                    {totalCurrentWeek.iphoneTradeInRate - totalLastWeek.iphoneTradeInRate > 0 ? '▲' : totalCurrentWeek.iphoneTradeInRate - totalLastWeek.iphoneTradeInRate < 0 ? '▼' : '-'} {Math.abs(totalCurrentWeek.iphoneTradeInRate - totalLastWeek.iphoneTradeInRate).toFixed(2)}%
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totalCurrentWeek.hostTotal}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totalCurrentWeek.tradeInCount}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: totalCurrentWeek.allCategoryTradeInRate >= 35 ? '#30d158' : totalCurrentWeek.allCategoryTradeInRate >= 25 ? '#ff9500' : '#ff3b30' }}>
                    {totalCurrentWeek.allCategoryTradeInRate.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '11px', color: getChangeColor(totalCurrentWeek.allCategoryTradeInRate - totalLastWeek.allCategoryTradeInRate) }}>
                    {totalCurrentWeek.allCategoryTradeInRate - totalLastWeek.allCategoryTradeInRate > 0 ? '▲' : totalCurrentWeek.allCategoryTradeInRate - totalLastWeek.allCategoryTradeInRate < 0 ? '▼' : '-'} {Math.abs(totalCurrentWeek.allCategoryTradeInRate - totalLastWeek.allCategoryTradeInRate).toFixed(2)}%
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totalCurrentWeek.installmentCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 说明提示 */}
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f7', borderRadius: '8px', color: '#6e6e73', fontSize: '13px' }}>
        <p><strong>使用说明：</strong></p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>周度数据统计周期为周日到周六</li>
          <li>iPhone换新率 = iPhone换新数 / iPhone销量</li>
          <li>全品类换新率 = 全品类换新数 / 主机总销量（含iPhone、iPad、Mac、Apple Watch）</li>
          <li>环比变化 = 本周数据 - 上周数据，▲表示上升（绿色），▼表示下降（红色），-表示持平</li>
          <li>换新率颜色：绿色≥35%，橙色25-35%，红色&lt;25%</li>
        </ul>
      </div>
    </div>
  );
}

// 周度计划看板页面 - 全新设计
function WeeklyPlanPage() {
  const { employees, getWeeklyPlan, saveWeeklyPlan, deleteWeeklyPlan, orders } = useApp();

  // 获取本周日作为默认选中周开始（周日开始，周六结束）
  const getSundayStr = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const getSundayDate = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    return d;
  };

  const thisSundayStr = getSundayStr(new Date());
  const thisSundayDate = getSundayDate(new Date());

  const [selectedWeekStart, setSelectedWeekStart] = useState(thisSundayStr);
  const [isEditing, setIsEditing] = useState(false);

  // 周选择器：生成过去12周+未来4周的选择
  const weekOptions = Array.from({ length: 16 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i - 12) * 7);
    const sundayDate = getSundayDate(date);
    const sundayStr = getSundayStr(date);
    const saturday = new Date(sundayDate);
    saturday.setDate(saturday.getDate() + 6);
    const isFuture = i > 12;
    const isCurrentWeek = i === 12;
    const weekNum = Math.ceil((sundayDate.getTime() - new Date(sundayDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return {
      value: sundayStr,
      label: `${sundayStr} (第${weekNum}周)`,
      isFuture,
      isCurrentWeek,
    };
  });

  const isFutureWeek = new Date(selectedWeekStart) > new Date(thisSundayStr);
  const isCurrentWeek = selectedWeekStart === thisSundayStr;

  // 筛选活跃的销售顾问
  const activeConsultants = employees.filter(e => e.isActive && e.position === '销售顾问');

  // 获取当前周的计划
  const currentPlan = getWeeklyPlan(selectedWeekStart);

  // 编辑状态
  const [editData, setEditData] = useState({
    iphonePerPerson: 10,
    tradeInRate: 35,
    installmentTarget: 4,
  });

  // 员工目标编辑状态
  const [employeeTargets, setEmployeeTargets] = useState<EmployeeWeeklyTarget[]>([]);

  // 初始化员工目标
  const initEmployeeTargets = (iphonePerPerson: number, tradeInRate: number, installment: number) => {
    setEmployeeTargets(activeConsultants.map(emp => ({
      employeeId: emp.id,
      employeeName: emp.name,
      iphoneTarget: iphonePerPerson,
      iphoneTradeInTarget: Math.ceil(iphonePerPerson * tradeInRate / 100),
      hostTarget: Math.ceil(iphonePerPerson * 1.2),
      allCategoryTradeInTarget: Math.ceil(iphonePerPerson * 1.2 * tradeInRate / 100),
      installmentTarget: installment,
    })));
  };

  // 初始化或加载数据
  useEffect(() => {
    setIsEditing(false);
    if (currentPlan) {
      // 加载已保存的计划
      setEditData({
        iphonePerPerson: currentPlan.targets.iphoneBaseline,
        tradeInRate: currentPlan.targets.iphoneTradeInRateTarget,
        installmentTarget: currentPlan.targets.installmentTarget,
      });
      setEmployeeTargets(currentPlan.employeeTargets);
    } else {
      // 新计划 - 默认值
      const perPerson = 10;
      const rate = 35;
      const installment = Math.ceil(4 / activeConsultants.length) || 1;
      setEditData({
        iphonePerPerson: perPerson,
        tradeInRate: rate,
        installmentTarget: installment,
      });
      initEmployeeTargets(perPerson, rate, installment);
    }
  }, [selectedWeekStart, currentPlan, activeConsultants.length]);

  // 更新个人目标
  const updateEmployeeTarget = (employeeId: string, field: keyof EmployeeWeeklyTarget, value: number) => {
    setEmployeeTargets(prev => prev.map(t =>
      t.employeeId === employeeId ? { ...t, [field]: value } : t
    ));
  };

  // 计算合计
  const totalTargets = {
    iphoneTarget: employeeTargets.reduce((sum, t) => sum + t.iphoneTarget, 0),
    iphoneTradeInTarget: employeeTargets.reduce((sum, t) => sum + t.iphoneTradeInTarget, 0),
    hostTarget: employeeTargets.reduce((sum, t) => sum + t.hostTarget, 0),
    installmentTarget: employeeTargets.reduce((sum, t) => sum + t.installmentTarget, 0),
  };

  // 获取本周实际数据
  const getWeekActualData = (weekStart: string) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const weekOrders = orders.filter(o => o.date >= weekStart && o.date <= weekEndStr);
    return {
      iphoneCount: weekOrders.filter(o => o.product === 'iPhone').length,
      iphoneTradeInCount: weekOrders.filter(o => o.product === 'iPhone' && o.hasTradeIn).length,
      hostTotal: weekOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length,
      installmentCount: weekOrders.filter(o => o.purchaseType === 'installment').length,
    };
  };

  const actualData = getWeekActualData(selectedWeekStart);

  // 保存计划
  const handleSave = async () => {
    const plan: WeeklyPlan = {
      id: currentPlan?.id || Math.random().toString(36).substr(2, 9),
      weekStartDate: selectedWeekStart,
      year: new Date(selectedWeekStart).getFullYear(),
      weekNumber: Math.ceil((new Date(selectedWeekStart).getTime() - new Date(new Date(selectedWeekStart).getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
      targets: {
        iphoneBaseline: editData.iphonePerPerson,
        iphoneTradeInRateMin: 25,
        iphoneTradeInRateTarget: editData.tradeInRate,
        allCategoryTradeInRateMin: 25,
        allCategoryTradeInRateTarget: editData.tradeInRate,
        installmentTarget: editData.installmentTarget,
      },
      employeeTargets: employeeTargets,
      createdAt: currentPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await saveWeeklyPlan(plan);
    if (result.success) {
      alert('计划已保存！');
      setIsEditing(false);
    } else {
      alert('保存失败: ' + (result.error || '未知错误'));
    }
  };

  // 删除计划
  const handleDelete = () => {
    if (confirm('确定删除本周计划吗？')) {
      deleteWeeklyPlan(selectedWeekStart);
    }
  };

  // 计算达成率
  const getProgress = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  return (
    <div className="weekly-plan-page">
      {/* 页面标题和周选择 */}
      <div className="page-header">
        <h2>周度计划看板</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="date-picker">
            <Calendar size={18} />
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}
            >
              {weekOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.isFuture ? '[未来] ' : opt.isCurrentWeek ? '[本周] ' : ''}{opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 状态卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
        {/* 计划状态 */}
        <div style={{
          background: currentPlan ? 'linear-gradient(135deg, #34c759 0%, #28a745 100%)' : 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
          borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target size={32} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>{isFutureWeek ? '未来周计划' : isCurrentWeek ? '本周计划' : '历史计划'}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {currentPlan ? '已设定' : '未设定'}
              </div>
            </div>
          </div>
        </div>

        {/* iPhone目标 */}
        <div style={{
          background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
          borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Apple size={32} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>iPhone销量目标</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {totalTargets.iphoneTarget} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>台</span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {activeConsultants.length}人 × {editData.iphonePerPerson}台/人
              </div>
            </div>
          </div>
        </div>

        {/* 换新目标 */}
        <div style={{
          background: 'linear-gradient(135deg, #30d158 0%, #248a3d 100%)',
          borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={32} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>换新目标</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {totalTargets.iphoneTradeInTarget} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>台</span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                换新率 {editData.tradeInRate}%
              </div>
            </div>
          </div>
        </div>

        {/* 分期目标 */}
        <div style={{
          background: 'linear-gradient(135deg, #af52de 0%, #8b3fb8 100%)',
          borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign size={32} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>分期目标</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {totalTargets.installmentTarget} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>笔</span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                每人 {Math.round(totalTargets.installmentTarget / activeConsultants.length)} 笔
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 实际完成情况（本周/历史周） */}
      {!isFutureWeek && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="#0071e3" />
            {isCurrentWeek ? '本周实际完成' : '该周实际完成'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {/* iPhone销量 */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #0071e3' }}>
              <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '8px' }}>iPhone销量</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: actualData.iphoneCount >= totalTargets.iphoneTarget ? '#34c759' : '#ff3b30' }}>
                  {actualData.iphoneCount}
                </span>
                <span style={{ fontSize: '16px', color: '#86868b' }}>/ {totalTargets.iphoneTarget}</span>
              </div>
              <div style={{ marginTop: '12px', background: '#f5f5f7', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getProgress(actualData.iphoneCount, totalTargets.iphoneTarget)}%`,
                  height: '100%',
                  background: actualData.iphoneCount >= totalTargets.iphoneTarget ? '#34c759' : '#ff3b30',
                  borderRadius: '8px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#86868b', marginTop: '8px' }}>
                {getProgress(actualData.iphoneCount, totalTargets.iphoneTarget)}% 完成
              </div>
            </div>

            {/* iPhone换新 */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #30d158' }}>
              <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '8px' }}>iPhone换新</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: actualData.iphoneTradeInCount >= totalTargets.iphoneTradeInTarget ? '#34c759' : '#ff3b30' }}>
                  {actualData.iphoneTradeInCount}
                </span>
                <span style={{ fontSize: '16px', color: '#86868b' }}>/ {totalTargets.iphoneTradeInTarget}</span>
              </div>
              <div style={{ marginTop: '12px', background: '#f5f5f7', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getProgress(actualData.iphoneTradeInCount, totalTargets.iphoneTradeInTarget)}%`,
                  height: '100%',
                  background: actualData.iphoneTradeInCount >= totalTargets.iphoneTradeInTarget ? '#34c759' : '#ff3b30',
                  borderRadius: '8px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#86868b', marginTop: '8px' }}>
                {getProgress(actualData.iphoneTradeInCount, totalTargets.iphoneTradeInTarget)}% 完成
              </div>
            </div>

            {/* 主机总销量 */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #ff9500' }}>
              <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '8px' }}>主机总销量</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: actualData.hostTotal >= totalTargets.hostTarget ? '#34c759' : '#ff9500' }}>
                  {actualData.hostTotal}
                </span>
                <span style={{ fontSize: '16px', color: '#86868b' }}>/ {totalTargets.hostTarget}</span>
              </div>
              <div style={{ marginTop: '12px', background: '#f5f5f7', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getProgress(actualData.hostTotal, totalTargets.hostTarget)}%`,
                  height: '100%',
                  background: actualData.hostTotal >= totalTargets.hostTarget ? '#34c759' : '#ff9500',
                  borderRadius: '8px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#86868b', marginTop: '8px' }}>
                {getProgress(actualData.hostTotal, totalTargets.hostTarget)}% 完成
              </div>
            </div>

            {/* 分期 */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #af52de' }}>
              <div style={{ fontSize: '12px', color: '#6e6e73', marginBottom: '8px' }}>分期笔数</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: actualData.installmentCount >= totalTargets.installmentTarget ? '#34c759' : '#af52de' }}>
                  {actualData.installmentCount}
                </span>
                <span style={{ fontSize: '16px', color: '#86868b' }}>/ {totalTargets.installmentTarget}</span>
              </div>
              <div style={{ marginTop: '12px', background: '#f5f5f7', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${getProgress(actualData.installmentCount, totalTargets.installmentTarget)}%`,
                  height: '100%',
                  background: actualData.installmentCount >= totalTargets.installmentTarget ? '#34c759' : '#af52de',
                  borderRadius: '8px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#86868b', marginTop: '8px' }}>
                {getProgress(actualData.installmentCount, totalTargets.installmentTarget)}% 完成
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑/设置区域 */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#0071e3" />
            个人目标分配
            <span style={{ fontSize: '12px', color: '#86868b', fontWeight: 'normal' }}>（可直接编辑）</span>
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (currentPlan) {
                      setEditData({
                        iphonePerPerson: currentPlan.targets.iphoneBaseline,
                        tradeInRate: currentPlan.targets.iphoneTradeInRateTarget,
                        installmentTarget: currentPlan.targets.installmentTarget,
                      });
                      setEmployeeTargets(currentPlan.employeeTargets);
                    } else {
                      setEditData({ iphonePerPerson: 10, tradeInRate: 35, installmentTarget: 4 });
                      initEmployeeTargets(10, 35, 4);
                    }
                  }}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d2d2d7', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#34c759', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  保存计划
                </button>
              </>
            ) : (
              <>
                {currentPlan && (
                  <button
                    onClick={handleDelete}
                    style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ff3b30', background: '#fff', color: '#ff3b30', cursor: 'pointer', fontSize: '14px' }}
                  >
                    删除
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#0071e3', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  {currentPlan ? '修改计划' : '设定计划'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 全局设置 */}
        {isEditing && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '14px', color: '#1d1d1f' }}>全局设置</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#6e6e73', display: 'block', marginBottom: '6px' }}>每人iPhone目标（台）</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editData.iphonePerPerson}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEditData({ ...editData, iphonePerPerson: val });
                    initEmployeeTargets(val, editData.tradeInRate, editData.installmentTarget);
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '15px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6e6e73', display: 'block', marginBottom: '6px' }}>换新率目标（%）</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editData.tradeInRate}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEditData({ ...editData, tradeInRate: val });
                    initEmployeeTargets(editData.iphonePerPerson, val, editData.installmentTarget);
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '15px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#6e6e73', display: 'block', marginBottom: '6px' }}>全店分期目标（笔）</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editData.installmentTarget}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEditData({ ...editData, installmentTarget: val });
                    initEmployeeTargets(editData.iphonePerPerson, editData.tradeInRate, Math.ceil(val / activeConsultants.length));
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 个人目标表格 */}
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f7' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#1d1d1f' }} rowspan="2">员工</th>
                {isFutureWeek ? (
                  <>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#0071e3', borderBottom: '1px solid #e0e0e0' }}>iPhone目标</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#30d158', borderBottom: '1px solid #e0e0e0' }}>换新目标</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#ff9500', borderBottom: '1px solid #e0e0e0' }}>主机目标</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#af52de', borderBottom: '1px solid #e0e0e0' }}>分期目标</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#0071e3', borderBottom: '1px solid #e0e0e0' }} colSpan={3}>iPhone</th>
                    <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#30d158', borderBottom: '1px solid #e0e0e0' }} colSpan={3}>换新</th>
                    <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#ff9500', borderBottom: '1px solid #e0e0e0' }} colSpan={2}>主机</th>
                    <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#af52de', borderBottom: '1px solid #e0e0e0' }} colSpan={2}>分期</th>
                  </>
                )}
              </tr>
              {!isFutureWeek && (
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>实际</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>目标</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>差距</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>实际</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>目标</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>差距</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>实际</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>目标</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>实际</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '11px', color: '#86868b' }}>目标</th>
                </tr>
              )}
            </thead>
            <tbody>
              {employeeTargets.map(target => {
                const weekEnd = new Date(selectedWeekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const weekEndStr = weekEnd.toISOString().split('T')[0];
                const empOrders = orders.filter(o => o.date >= selectedWeekStart && o.date <= weekEndStr && o.employeeId === target.employeeId);
                const empActualIphone = empOrders.filter(o => o.product === 'iPhone').length;
                const empActualTradeIn = empOrders.filter(o => o.hasTradeIn).length;
                const empActualHost = empOrders.filter(o => ['iPhone', 'iPad', 'Mac', 'Apple Watch'].includes(o.product)).length;
                const empActualInstallment = empOrders.filter(o => o.purchaseType === 'installment').length;

                const iphoneGap = empActualIphone - target.iphoneTarget;
                const tradeInGap = empActualTradeIn - target.iphoneTradeInTarget;

                const getGapStyle = (gap: number) => {
                  if (gap >= 0) return { color: '#34c759', bg: '#e8f5e9' };
                  return { color: '#ff3b30', bg: '#ffebee' };
                };

                const iphoneStyle = !isFutureWeek ? getGapStyle(iphoneGap) : {};
                const tradeInStyle = !isFutureWeek ? getGapStyle(tradeInGap) : {};

                return (
                  <tr key={target.employeeId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', fontSize: '14px' }}>{target.employeeName}</td>
                    {isFutureWeek ? (
                      <>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.iphoneTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'iphoneTarget', Number(e.target.value))}
                              style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #0071e3', fontSize: '13px', textAlign: 'center', color: '#0071e3', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#0071e3' }}>{target.iphoneTarget}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.iphoneTradeInTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'iphoneTradeInTarget', Number(e.target.value))}
                              style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #30d158', fontSize: '13px', textAlign: 'center', color: '#30d158', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#30d158' }}>{target.iphoneTradeInTarget}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.hostTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'hostTarget', Number(e.target.value))}
                              style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #ff9500', fontSize: '13px', textAlign: 'center', color: '#ff9500', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#ff9500' }}>{target.hostTarget}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.installmentTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'installmentTarget', Number(e.target.value))}
                              style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #af52de', fontSize: '13px', textAlign: 'center', color: '#af52de', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#af52de' }}>{target.installmentTarget}</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* iPhone */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', background: empActualIphone >= target.iphoneTarget ? '#f0fff4' : '#fff5f5' }}>
                          <span style={{ fontWeight: 'bold', color: empActualIphone >= target.iphoneTarget ? '#34c759' : '#ff3b30' }}>{empActualIphone}</span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.iphoneTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'iphoneTarget', Number(e.target.value))}
                              style={{ width: '45px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #0071e3', fontSize: '12px', textAlign: 'center', color: '#0071e3', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#0071e3' }}>{target.iphoneTarget}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', background: iphoneStyle.bg }}>
                          <span style={{ fontWeight: 'bold', color: iphoneStyle.color, fontSize: '13px' }}>
                            {iphoneGap >= 0 ? '+' : ''}{iphoneGap}
                          </span>
                        </td>
                        {/* 换新 */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', background: empActualTradeIn >= target.iphoneTradeInTarget ? '#f0fff4' : '#fff5f5' }}>
                          <span style={{ fontWeight: 'bold', color: empActualTradeIn >= target.iphoneTradeInTarget ? '#34c759' : '#ff3b30' }}>{empActualTradeIn}</span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.iphoneTradeInTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'iphoneTradeInTarget', Number(e.target.value))}
                              style={{ width: '45px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #30d158', fontSize: '12px', textAlign: 'center', color: '#30d158', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#30d158' }}>{target.iphoneTradeInTarget}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', background: tradeInStyle.bg }}>
                          <span style={{ fontWeight: 'bold', color: tradeInStyle.color, fontSize: '13px' }}>
                            {tradeInGap >= 0 ? '+' : ''}{tradeInGap}
                          </span>
                        </td>
                        {/* 主机 */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', background: empActualHost >= target.hostTarget ? '#f0fff4' : '#fffaf0' }}>
                          <span style={{ fontWeight: 'bold', color: empActualHost >= target.hostTarget ? '#34c759' : '#ff9500' }}>{empActualHost}</span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.hostTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'hostTarget', Number(e.target.value))}
                              style={{ width: '45px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #ff9500', fontSize: '12px', textAlign: 'center', color: '#ff9500', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#ff9500' }}>{target.hostTarget}</span>
                          )}
                        </td>
                        {/* 分期 */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', background: empActualInstallment >= target.installmentTarget ? '#f0fff4' : '#faf0ff' }}>
                          <span style={{ fontWeight: 'bold', color: empActualInstallment >= target.installmentTarget ? '#34c759' : '#af52de' }}>{empActualInstallment}</span>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={target.installmentTarget}
                              onChange={(e) => updateEmployeeTarget(target.employeeId, 'installmentTarget', Number(e.target.value))}
                              style={{ width: '45px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #af52de', fontSize: '12px', textAlign: 'center', color: '#af52de', fontWeight: 'bold' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: '#af52de' }}>{target.installmentTarget}</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f5f5f7', fontWeight: 'bold' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px' }}>合计</td>
                {isFutureWeek ? (
                  <>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '16px', color: '#0071e3' }}>{totalTargets.iphoneTarget}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '16px', color: '#30d158' }}>{totalTargets.iphoneTradeInTarget}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '16px', color: '#ff9500' }}>{totalTargets.hostTarget}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '16px', color: '#af52de' }}>{totalTargets.installmentTarget}</td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: actualData.iphoneCount >= totalTargets.iphoneTarget ? '#34c759' : '#ff3b30', background: actualData.iphoneCount >= totalTargets.iphoneTarget ? '#f0fff4' : '#fff5f5' }}>{actualData.iphoneCount}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: '#0071e3' }}>{totalTargets.iphoneTarget}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: (actualData.iphoneCount - totalTargets.iphoneTarget) >= 0 ? '#34c759' : '#ff3b30', background: (actualData.iphoneCount - totalTargets.iphoneTarget) >= 0 ? '#f0fff4' : '#fff5f5' }}>
                      {(actualData.iphoneCount - totalTargets.iphoneTarget) >= 0 ? '+' : ''}{actualData.iphoneCount - totalTargets.iphoneTarget}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: actualData.iphoneTradeInCount >= totalTargets.iphoneTradeInTarget ? '#34c759' : '#ff3b30', background: actualData.iphoneTradeInCount >= totalTargets.iphoneTradeInTarget ? '#f0fff4' : '#fff5f5' }}>{actualData.iphoneTradeInCount}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: '#30d158' }}>{totalTargets.iphoneTradeInTarget}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: (actualData.iphoneTradeInCount - totalTargets.iphoneTradeInTarget) >= 0 ? '#34c759' : '#ff3b30', background: (actualData.iphoneTradeInCount - totalTargets.iphoneTradeInTarget) >= 0 ? '#f0fff4' : '#fff5f5' }}>
                      {(actualData.iphoneTradeInCount - totalTargets.iphoneTradeInTarget) >= 0 ? '+' : ''}{actualData.iphoneTradeInCount - totalTargets.iphoneTradeInTarget}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: actualData.hostTotal >= totalTargets.hostTarget ? '#34c759' : '#ff9500', background: actualData.hostTotal >= totalTargets.hostTarget ? '#f0fff4' : '#fffaf0' }}>{actualData.hostTotal}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: '#ff9500' }}>{totalTargets.hostTarget}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: actualData.installmentCount >= totalTargets.installmentTarget ? '#34c759' : '#af52de', background: actualData.installmentCount >= totalTargets.installmentTarget ? '#f0fff4' : '#faf0ff' }}>{actualData.installmentCount}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: '15px', color: '#af52de' }}>{totalTargets.installmentTarget}</td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ marginTop: '24px', padding: '20px', background: '#f5f5f7', borderRadius: '12px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#1d1d1f' }}>使用说明</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6e6e73', lineHeight: '1.8' }}>
          <li>选择周日期可查看或编辑对应周的的计划</li>
          <li>点击「设定计划」或「修改计划」进入编辑模式</li>
          <li>在编辑模式下设置每人目标和换新率，系统自动计算分配</li>
          <li>可单独调整每个人的目标（适用于员工休假情况）</li>
          <li>点击「保存计划」保存修改，删除计划需点击「删除」按钮</li>
          <li>本周或历史周的表格会显示实际完成数据对比</li>
        </ul>
      </div>
    </div>
  );
}

// 员工管理页面
function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '销售顾问',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
    } else {
      addEmployee({ ...formData, isActive: true });
    }

    setFormData({ name: '', position: '销售顾问' });
    setEditingEmployee(null);
    setIsModalOpen(false);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      position: emp.position,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该员工吗？')) {
      deleteEmployee(id);
    }
  };

  const handleToggleActive = (emp: Employee) => {
    updateEmployee(emp.id, { isActive: !emp.isActive });
  };

  return (
    <div className="employees-page">
      <div className="page-header">
        <h2>员工管理</h2>
        <button className="add-order-btn" onClick={() => {
          setEditingEmployee(null);
          setFormData({ name: '', position: '销售顾问' });
          setIsModalOpen(true);
        }}>
          <Plus size={18} />
          添加员工
        </button>
      </div>

      <div className="employees-grid">
        {employees.map(emp => (
          <div key={emp.id} className={`employee-detail-card ${!emp.isActive ? 'inactive' : ''}`}>
            <div className="employee-header">
              <div className="employee-avatar large">
                {emp.name.charAt(0)}
              </div>
              <div className="employee-basic">
                <h3>{emp.name}</h3>
                <span className="employee-position">{emp.position}</span>
              </div>
            </div>
            <div className="employee-actions">
              <button
                className="action-btn edit"
                onClick={() => handleEdit(emp)}
              >
                <Settings size={16} />
                编辑
              </button>
              <button
                className={`action-btn ${emp.isActive ? 'disable' : 'enable'}`}
                onClick={() => handleToggleActive(emp)}
              >
                {emp.isActive ? '禁用' : '启用'}
              </button>
              <button
                className="action-btn delete"
                onClick={() => handleDelete(emp.id)}
              >
                <X size={16} />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加/编辑员工弹窗 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <div className="modal-header">
              <h2>{editingEmployee ? '编辑员工' : '添加员工'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-group">
                <label>姓名 <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="请输入员工姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>岗位</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                >
                  <option value="销售顾问">销售顾问</option>
                  <option value="高级顾问">高级顾问</option>
                  <option value="技术支持">技术支持</option>
                  <option value="店长">店长</option>
                  <option value="副店长">副店长</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">
                {editingEmployee ? '保存修改' : '添加员工'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 主应用组件
function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  return (
    <div className="app">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'orders' && <OrdersPage />}
        {currentPage === 'import' && <ImportPage />}
        {currentPage === 'employees' && <EmployeesPage />}
        {currentPage === 'training' && <TrainingPage />}
        {currentPage === 'weekly_data' && <WeeklyDataPage />}
        {currentPage === 'weekly_plan' && <WeeklyPlanPage />}
      </main>
      <footer className="footer">
        <span>Apple 授权专营店 销量管理系统 © 2024</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
