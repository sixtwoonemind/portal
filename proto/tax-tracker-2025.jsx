import React, { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, Home, Package, TrendingUp } from 'lucide-react';

export default function TaxTracker2025() {
  const [subscriptions, setSubscriptions] = useState([
    { id: 1, name: 'Spectrum Business Internet', monthlyAmount: 80, startMonth: 1, endMonth: 12 },
    { id: 2, name: 'M365 Business Premium', monthlyAmount: 25, startMonth: 1, endMonth: 12 },
  ]);
  
  const [oneTimeExpenses, setOneTimeExpenses] = useState([]);
  
  const [homeExpenses, setHomeExpenses] = useState({
    electric: 0,
    gas: 0,
    water: 0,
    mortgageInterest: 0,
    propertyTax: 0,
    homeInsurance: 0,
    hoa: 0,
    repairs: 0,
  });
  
  const [etsyRevenue, setEtsyRevenue] = useState(Array(12).fill(0));
  const [etsyFees, setEtsyFees] = useState(Array(12).fill(0));
  
  const officePercentage = 0.117; // 120 sq ft / 1024 sq ft
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Add subscription
  const addSubscription = () => {
    setSubscriptions([...subscriptions, {
      id: Date.now(),
      name: '',
      monthlyAmount: 0,
      startMonth: 1,
      endMonth: 12,
    }]);
  };
  
  // Add one-time expense
  const addOneTimeExpense = () => {
    setOneTimeExpenses([...oneTimeExpenses, {
      id: Date.now(),
      name: '',
      amount: 0,
      month: 1,
      category: 'IT Equipment',
    }]);
  };
  
  // Calculate totals
  const totals = useMemo(() => {
    // Subscription totals
    const subTotal = subscriptions.reduce((sum, sub) => {
      const months = (sub.endMonth - sub.startMonth + 1);
      return sum + (sub.monthlyAmount * months);
    }, 0);
    
    // One-time expense totals
    const oneTimeTotal = oneTimeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Home office deduction
    const totalHomeExpenses = Object.values(homeExpenses).reduce((sum, val) => sum + val, 0);
    const homeOfficeDeduction = totalHomeExpenses * officePercentage;
    
    // Etsy totals
    const etsyRevenueTotal = etsyRevenue.reduce((sum, val) => sum + val, 0);
    const etsyFeesTotal = etsyFees.reduce((sum, val) => sum + val, 0);
    
    // Total expenses
    const totalExpenses = subTotal + oneTimeTotal + homeOfficeDeduction + etsyFeesTotal;
    
    return {
      subscriptions: subTotal,
      oneTime: oneTimeTotal,
      homeOffice: homeOfficeDeduction,
      etsyFees: etsyFeesTotal,
      etsyRevenue: etsyRevenueTotal,
      totalExpenses,
      netEtsy: etsyRevenueTotal - etsyFeesTotal,
    };
  }, [subscriptions, oneTimeExpenses, homeExpenses, etsyRevenue, etsyFees]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Six Two One Design LLC - 2025 Tax Tracker</h1>
          <p className="text-gray-600">Track expenses and revenue for tax year 2025</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-700">Subscriptions</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">${totals.subscriptions.toFixed(2)}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-purple-600" size={20} />
              <h3 className="font-semibold text-gray-700">Equipment</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">${totals.oneTime.toFixed(2)}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Home className="text-green-600" size={20} />
              <h3 className="font-semibold text-gray-700">Home Office</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">${totals.homeOffice.toFixed(2)}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-orange-600" size={20} />
              <h3 className="font-semibold text-gray-700">Net Etsy</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">${totals.netEtsy.toFixed(2)}</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 mb-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Total Business Expenses (2025)</h2>
          <p className="text-4xl font-bold">${totals.totalExpenses.toFixed(2)}</p>
        </div>

        {/* Subscriptions Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Monthly Subscriptions</h2>
            <button
              onClick={addSubscription}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Add Subscription
            </button>
          </div>
          
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Subscription name"
                  value={sub.name}
                  onChange={(e) => setSubscriptions(subscriptions.map(s => 
                    s.id === sub.id ? { ...s, name: e.target.value } : s
                  ))}
                  className="col-span-4 px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="$/month"
                  value={sub.monthlyAmount || ''}
                  onChange={(e) => setSubscriptions(subscriptions.map(s => 
                    s.id === sub.id ? { ...s, monthlyAmount: parseFloat(e.target.value) || 0 } : s
                  ))}
                  className="col-span-2 px-3 py-2 border rounded-lg"
                />
                <select
                  value={sub.startMonth}
                  onChange={(e) => setSubscriptions(subscriptions.map(s => 
                    s.id === sub.id ? { ...s, startMonth: parseInt(e.target.value) } : s
                  ))}
                  className="col-span-2 px-3 py-2 border rounded-lg"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={sub.endMonth}
                  onChange={(e) => setSubscriptions(subscriptions.map(s => 
                    s.id === sub.id ? { ...s, endMonth: parseInt(e.target.value) } : s
                  ))}
                  className="col-span-2 px-3 py-2 border rounded-lg"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <div className="col-span-1 font-semibold text-right">
                  ${((sub.endMonth - sub.startMonth + 1) * sub.monthlyAmount).toFixed(2)}
                </div>
                <button
                  onClick={() => setSubscriptions(subscriptions.filter(s => s.id !== sub.id))}
                  className="col-span-1 text-red-600 hover:text-red-800 transition flex justify-center"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* One-Time Expenses */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">One-Time Expenses</h2>
            <button
              onClick={addOneTimeExpense}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
          
          <div className="space-y-3">
            {oneTimeExpenses.map((exp) => (
              <div key={exp.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Item name"
                  value={exp.name}
                  onChange={(e) => setOneTimeExpenses(oneTimeExpenses.map(e => 
                    e.id === exp.id ? { ...e, name: e.target.value } : e
                  ))}
                  className="col-span-4 px-3 py-2 border rounded-lg"
                />
                <select
                  value={exp.category}
                  onChange={(e) => setOneTimeExpenses(oneTimeExpenses.map(ex => 
                    ex.id === exp.id ? { ...ex, category: e.target.value } : ex
                  ))}
                  className="col-span-3 px-3 py-2 border rounded-lg"
                >
                  <option value="IT Equipment">IT Equipment</option>
                  <option value="Software">Software</option>
                  <option value="Office Furniture">Office Furniture</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={exp.amount || ''}
                  onChange={(e) => setOneTimeExpenses(oneTimeExpenses.map(ex => 
                    ex.id === exp.id ? { ...ex, amount: parseFloat(e.target.value) || 0 } : ex
                  ))}
                  className="col-span-2 px-3 py-2 border rounded-lg"
                />
                <select
                  value={exp.month}
                  onChange={(e) => setOneTimeExpenses(oneTimeExpenses.map(ex => 
                    ex.id === exp.id ? { ...ex, month: parseInt(e.target.value) } : ex
                  ))}
                  className="col-span-2 px-3 py-2 border rounded-lg"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={() => setOneTimeExpenses(oneTimeExpenses.filter(e => e.id !== exp.id))}
                  className="col-span-1 text-red-600 hover:text-red-800 transition flex justify-center"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Home Office Expenses */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Home Office Expenses (Actual Method)</h2>
          <p className="text-sm text-gray-600 mb-4">Office: 120 sq ft / 1,024 sq ft = 11.7% deduction</p>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
              electric: 'Electric Bills (annual)',
              gas: 'Gas/Heating (annual)',
              water: 'Water/Sewer (annual)',
              mortgageInterest: 'Mortgage Interest',
              propertyTax: 'Property Tax',
              homeInsurance: 'Home Insurance',
              hoa: 'HOA Fees',
              repairs: 'Repairs/Maintenance',
            }).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={homeExpenses[key] || ''}
                  onChange={(e) => setHomeExpenses({
                    ...homeExpenses,
                    [key]: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Home Expenses:</span>
              <span>${Object.values(homeExpenses).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-green-600 mt-2">
              <span>Deductible Amount (11.7%):</span>
              <span>${totals.homeOffice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Etsy Revenue & Fees */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Etsy Store - Monthly Revenue & Fees</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Month</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="text-right py-2 px-3">Fees</th>
                  <th className="text-right py-2 px-3">Net</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-3 font-medium">{month}</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={etsyRevenue[i] || ''}
                        onChange={(e) => {
                          const newRevenue = [...etsyRevenue];
                          newRevenue[i] = parseFloat(e.target.value) || 0;
                          setEtsyRevenue(newRevenue);
                        }}
                        className="w-full text-right px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={etsyFees[i] || ''}
                        onChange={(e) => {
                          const newFees = [...etsyFees];
                          newFees[i] = parseFloat(e.target.value) || 0;
                          setEtsyFees(newFees);
                        }}
                        className="w-full text-right px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">
                      ${((etsyRevenue[i] || 0) - (etsyFees[i] || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td className="py-2 px-3">Total</td>
                  <td className="py-2 px-3 text-right">${totals.etsyRevenue.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${totals.etsyFees.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">${totals.netEtsy.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
