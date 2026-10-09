import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingDown,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle,
  Truck,
  Receipt,
  PieChart,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  costPriceInPaise: number;
  sellingPriceInPaise: number;
  quantityInStock: number;
  minThresholdAlert: number;
  isLowStock: boolean;
  unit: string;
}

interface ExpenseItem {
  _id: string;
  category: string;
  amountInPaise: number;
  vendorName: string;
  paymentMethod: string;
  date: string;
  notes?: string;
}

interface PnlData {
  revenue: {
    grossRevenueInPaise: number;
    grossRevenueFormatted: string;
  };
  expenses: {
    totalExpensesInPaise: number;
    totalExpensesFormatted: string;
    byCategory: { category: string; amountInPaise: number; percentageOfExpenses: number }[];
  };
  profitability: {
    netProfitInPaise: number;
    netProfitFormatted: string;
    profitMargin: number;
    isProfitable: boolean;
  };
}

export const InventoryExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'expenses' | 'pnl' | 'suppliers'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockType, setStockType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState('Store sales');

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'UTILITIES',
    amount: '',
    vendorName: '',
    paymentMethod: 'UPI',
    notes: '',
  });

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: 'SUPPLEMENTS',
    costPrice: '',
    sellingPrice: '',
    initialStock: '10',
    minThreshold: '5',
    unit: 'pcs',
  });

  // Sample data fallback
  const sampleInventory: InventoryItem[] = [
    {
      _id: 'inv-1',
      name: 'Optimum Nutrition Gold Standard Whey 2kg',
      sku: 'WHEY-ON-2KG',
      category: 'SUPPLEMENTS',
      costPriceInPaise: 450000,
      sellingPriceInPaise: 620000,
      quantityInStock: 18,
      minThresholdAlert: 5,
      isLowStock: false,
      unit: 'tub',
    },
    {
      _id: 'inv-2',
      name: 'GymOS Performance Gym Shaker 700ml',
      sku: 'SHAKER-700ML',
      category: 'MERCHANDISE',
      costPriceInPaise: 18000,
      sellingPriceInPaise: 45000,
      quantityInStock: 2,
      minThresholdAlert: 5,
      isLowStock: true,
      unit: 'bottle',
    },
    {
      _id: 'inv-3',
      name: 'Creatine Monohydrate 300g Micronized',
      sku: 'CREA-300G',
      category: 'SUPPLEMENTS',
      costPriceInPaise: 80000,
      sellingPriceInPaise: 135000,
      quantityInStock: 1,
      minThresholdAlert: 4,
      isLowStock: true,
      unit: 'tub',
    },
    {
      _id: 'inv-4',
      name: 'Techofay Pro Lifting Wrist Straps',
      sku: 'STRAPS-PRO',
      category: 'ACCESSORIES',
      costPriceInPaise: 25000,
      sellingPriceInPaise: 59900,
      quantityInStock: 14,
      minThresholdAlert: 4,
      isLowStock: false,
      unit: 'pair',
    },
  ];

  const sampleExpenses: ExpenseItem[] = [
    {
      _id: 'exp-1',
      category: 'RENT',
      amountInPaise: 15000000,
      vendorName: 'Indiranagar Commercial Plaza',
      paymentMethod: 'BANK_TRANSFER',
      date: new Date().toISOString(),
      notes: 'Monthly branch floor rental',
    },
    {
      _id: 'exp-2',
      category: 'UTILITIES',
      amountInPaise: 4200000,
      vendorName: 'Electricity & HVAC Services',
      paymentMethod: 'UPI',
      date: new Date().toISOString(),
      notes: 'Air conditioning power consumption',
    },
    {
      _id: 'exp-3',
      category: 'SALARY',
      amountInPaise: 28000000,
      vendorName: 'Staff & Trainer Payroll',
      paymentMethod: 'BANK_TRANSFER',
      date: new Date().toISOString(),
      notes: 'October trainers & front desk payroll',
    },
  ];

  const samplePnl: PnlData = {
    revenue: {
      grossRevenueInPaise: 85000000,
      grossRevenueFormatted: '₹8,50,000',
    },
    expenses: {
      totalExpensesInPaise: 47200000,
      totalExpensesFormatted: '₹4,72,000',
      byCategory: [
        { category: 'SALARY', amountInPaise: 28000000, percentageOfExpenses: 59 },
        { category: 'RENT', amountInPaise: 15000000, percentageOfExpenses: 32 },
        { category: 'UTILITIES', amountInPaise: 4200000, percentageOfExpenses: 9 },
      ],
    },
    profitability: {
      netProfitInPaise: 37800000,
      netProfitFormatted: '₹3,78,000',
      profitMargin: 44,
      isProfitable: true,
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gymos_token');
      const [invRes, expRes, pnlRes] = await Promise.all([
        fetch('/api/inventory', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/expenses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/expenses/profit-and-loss', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (invRes.ok) {
        const d = await invRes.json();
        setInventory(d.data || []);
      } else {
        setInventory(sampleInventory);
      }

      if (expRes.ok) {
        const d = await expRes.json();
        setExpenses(d.data || []);
      } else {
        setExpenses(sampleExpenses);
      }

      if (pnlRes.ok) {
        const d = await pnlRes.json();
        setPnl(d.data);
      } else {
        setPnl(samplePnl);
      }
    } catch {
      setInventory(sampleInventory);
      setExpenses(sampleExpenses);
      setPnl(samplePnl);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (stockType === 'STOCK_OUT' && stockQty > selectedItem.quantityInStock) {
      alert(`Cannot adjust stock: requested reduction of ${stockQty} exceeds available stock (${selectedItem.quantityInStock})`);
      return;
    }

    try {
      const token = localStorage.getItem('gymos_token');
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inventoryId: selectedItem._id,
          type: stockType,
          quantity: stockQty,
          reason: stockReason,
        }),
      });

      if (res.ok) {
        setShowStockModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Stock adjustment failed');
      }
    } catch {
      alert('Error updating stock');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('gymos_token');
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchId: 'default-branch',
          category: newExpense.category,
          amountInPaise: Math.round(Number(newExpense.amount) * 100),
          vendorName: newExpense.vendorName,
          paymentMethod: newExpense.paymentMethod,
          notes: newExpense.notes,
        }),
      });

      if (res.ok) {
        setShowAddExpenseModal(false);
        setNewExpense({ category: 'UTILITIES', amount: '', vendorName: '', paymentMethod: 'UPI', notes: '' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to record expense');
      }
    } catch {
      alert('Error submitting expense');
    }
  };

  const lowStockItems = inventory.filter((i) => i.isLowStock || i.quantityInStock <= i.minThresholdAlert);

  const filteredInventory = inventory.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? i.category === categoryFilter : true;
    return matchSearch && matchCat;
  });

  const currentPnl = pnl || samplePnl;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Package className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Inventory & Business Expenses
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Atomic Stock Engine
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Track stock in/out, low-stock threshold alerts, operating expenses, and financial Profit & Loss (P&L)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md transition-all hover:scale-[1.02]"
          >
            <Receipt className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold">{lowStockItems.length} Inventory Items Low on Stock!</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.quantityInStock} ${i.unit} remaining)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-medium"
          >
            Reorder Now
          </button>
        </div>
      )}

      {/* P&L Snapshot Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Gross Revenue</div>
            <div className="text-2xl font-bold text-foreground mt-1">{currentPnl.revenue.grossRevenueFormatted}</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> From Member Invoices
            </div>
          </div>
          <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Operating Expenses</div>
            <div className="text-2xl font-bold text-foreground mt-1">{currentPnl.expenses.totalExpensesFormatted}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Utilities, Salary, Rent
            </div>
          </div>
          <span className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-6 h-6" />
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-emerald-500/40 shadow-md shadow-emerald-950/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Net Profit / EBITDA</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{currentPnl.profitability.netProfitFormatted}</div>
            <div className="text-xs font-semibold text-foreground mt-0.5">
              Margin: {currentPnl.profitability.profitMargin}%
            </div>
          </div>
          <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          Supplements & Merchandise Stock
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Operating Expenses
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pnl'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PieChart className="w-4 h-4" />
          P&L Financial Breakdown
        </button>
      </div>

      {/* Tab 1: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search SKU or item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              >
                <option value="">All Categories</option>
                <option value="SUPPLEMENTS">Supplements</option>
                <option value="MERCHANDISE">Merchandise</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">In Stock</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInventory.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium">
                      <div>{item.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-muted-foreground">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {item.quantityInStock} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-medium">
                      ₹{(item.sellingPriceInPaise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground text-xs">
                      ₹{(item.costPriceInPaise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isLowStock || item.quantityInStock <= item.minThresholdAlert ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setStockType('STOCK_IN');
                          setStockQty(5);
                          setShowStockModal(true);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-medium transition-colors"
                      >
                        + Stock In
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setStockType('STOCK_OUT');
                          setStockQty(1);
                          setShowStockModal(true);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium transition-colors"
                      >
                        - Stock Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Expenses Tracker */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor / Payee</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                      {new Date(exp.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted border border-border">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{exp.vendorName}</td>
                    <td className="py-3.5 px-4 text-xs font-mono">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                      ₹{(exp.amountInPaise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{exp.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Profit & Loss Statement */}
      {activeTab === 'pnl' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-foreground">Comprehensive Profit & Loss (P&L) Statement</h3>
              <p className="text-sm text-muted-foreground">Real-time consolidated financials for current billing cycle</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">EBITDA Margin</div>
              <div className="text-2xl font-bold text-emerald-400">{currentPnl.profitability.profitMargin}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Revenue Sources
              </h4>
              <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Membership Subscriptions & Renewals</span>
                  <span className="font-semibold">{currentPnl.revenue.grossRevenueFormatted}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground text-xs">
                  <span>Supplements & Retail Sales</span>
                  <span>Included in Gross Total</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-rose-400" /> Operating Cost Breakdown
              </h4>
              <div className="space-y-2">
                {currentPnl.expenses.byCategory.map((cat) => (
                  <div key={cat.category} className="p-3 rounded-lg border border-border bg-background flex justify-between text-xs">
                    <span className="font-medium text-foreground">{cat.category}</span>
                    <span className="font-mono">
                      ₹{(cat.amountInPaise / 100).toLocaleString('en-IN')} ({cat.percentageOfExpenses}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              {stockType === 'STOCK_IN' ? 'Stock In (+)' : 'Stock Out (-)'} : {selectedItem.name}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              SKU: {selectedItem.sku} • Current Stock: {selectedItem.quantityInStock} {selectedItem.unit}
            </p>

            <form onSubmit={handleStockAdjust} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity ({selectedItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reason / Notes</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-medium text-xs text-white transition-colors ${
                    stockType === 'STOCK_IN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Record Operating Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  <option value="UTILITIES">Utilities (Electricity, Water, HVAC)</option>
                  <option value="RENT">Rent & Property</option>
                  <option value="SALARY">Salary & Payroll</option>
                  <option value="EQUIPMENT">Equipment Maintenance</option>
                  <option value="MARKETING">Marketing & Advertising</option>
                  <option value="SUPPLIES">Supplies & Cleaning</option>
                  <option value="OTHER">Other Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Power Corp"
                  value={newExpense.vendorName}
                  onChange={(e) => setNewExpense({ ...newExpense, vendorName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Method</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryExpensesPage;
