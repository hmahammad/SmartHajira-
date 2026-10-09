import React, { useState } from 'react';
import { PayrollRecord, Student } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { DollarSign, Printer, CheckCircle2, Clock, PlusCircle, AlertCircle, Calendar, Download, Send, CreditCard } from 'lucide-react';

interface PayrollViewProps {
  students: Student[];
  payrollRecords: PayrollRecord[];
  orgInfo: OrgCategoryInfo;
  onUpdatePayrollStatus: (recordId: string, status: 'Paid' | 'Pending', method?: 'bKash' | 'Nagad' | 'Bank' | 'Cash') => void;
  onAddPayrollRecord: (record: PayrollRecord) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  students,
  payrollRecords,
  orgInfo,
  onUpdatePayrollStatus,
  onAddPayrollRecord,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('জুলাই ২০২৬');
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states for generating salary
  const [selectedMemberId, setSelectedMemberId] = useState<string>(students[0]?.id || '');
  const [baseSalaryInput, setBaseSalaryInput] = useState<number>(35000);
  const [presentDaysInput, setPresentDaysInput] = useState<number>(22);
  const [overtimeHoursInput, setOvertimeHoursInput] = useState<number>(10);
  const [overtimeRateInput, setOvertimeRateInput] = useState<number>(300);
  const [bonusInput, setBonusInput] = useState<number>(2000);
  const [fineInput, setFineInput] = useState<number>(500);
  const [advanceInput, setAdvanceInput] = useState<number>(1000);

  const calculateNetPayable = () => {
    const overtimeTotal = overtimeHoursInput * overtimeRateInput;
    return Math.max(0, baseSalaryInput + overtimeTotal + bonusInput - fineInput - advanceInput);
  };

  const handleCreatePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const member = students.find((s) => s.id === selectedMemberId);
    if (!member) return;

    const net = calculateNetPayable();
    const newRecord: PayrollRecord = {
      id: `pay-${Date.now()}`,
      memberId: member.id,
      memberName: member.nameBangla,
      roll: member.roll,
      monthYear: selectedMonth,
      baseSalary: baseSalaryInput,
      presentDays: presentDaysInput,
      absentDays: 24 - presentDaysInput,
      lateDays: 2,
      overtimeHours: overtimeHoursInput,
      overtimeRate: overtimeRateInput,
      bonusAmount: bonusInput,
      fineDeduction: fineInput,
      advanceLoanDeduction: advanceInput,
      netPayable: net,
      status: 'Pending',
      paymentMethod: 'bKash'
    };

    onAddPayrollRecord(newRecord);
    setShowAddModal(false);
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const totalPayrollAmount = payrollRecords.reduce((sum, r) => sum + r.netPayable, 0);
  const totalPaidAmount = payrollRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.netPayable, 0);
  const totalPendingAmount = totalPayrollAmount - totalPaidAmount;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">স্মার্ট পে-রোল ও বেতনের হিসাব</span>
          </div>
          <h2 className="text-xl font-extrabold">{orgInfo.terminology.orgCategoryName} - পে-রোল ড্যাশবোর্ড</h2>
          <p className="text-xs text-slate-300 mt-1">
            হাজিরা অনুযায়ী স্বয়ংক্রিয় বেতন, ওভারটাইম, বোনাস ও মোবাইল ব্যাংকিং পেমেন্ট
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
          >
            <option value="জুলাই ২০২৬">জুলাই ২০২৬</option>
            <option value="জুন ২০২৬">জুন ২০২৬</option>
            <option value="মে ২০২৬">মে ২০২৬</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন পে-রোল তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
            <span>মোট পে-রোল পরিমাণ</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ৳ {totalPayrollAmount.toLocaleString('bn-BD')}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            {payrollRecords.length} জন কর্মচারীর বেতন হিসাবকৃত
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
            <span>পরিশোধিত বেতন (Paid)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ৳ {totalPaidAmount.toLocaleString('bn-BD')}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 inline-block">
            বিকাশ / নগদ / ব্যাংক মারফত স্থানান্তরিত
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-2">
            <span>বকেয়া পরিমাণ (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            ৳ {totalPendingAmount.toLocaleString('bn-BD')}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">
            অনুমোদনের অপেক্ষায়
          </span>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>{selectedMonth} মাসের বেতন তালিকা</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            মোট রেকর্ড: {payrollRecords.length} টি
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{orgInfo.terminology.memberLabel}</th>
                <th className="px-4 py-3">{orgInfo.terminology.idLabel}</th>
                <th className="px-4 py-3">মূল বেতন</th>
                <th className="px-4 py-3">হাজিরা দিন</th>
                <th className="px-4 py-3">ওভারটাইম</th>
                <th className="px-4 py-3">বোনাস (+)</th>
                <th className="px-4 py-3">জরিমানা / অগ্রিম (-)</th>
                <th className="px-4 py-3">নিট প্রদেয়</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {payrollRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    {record.memberName}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                    {record.roll}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    ৳ {record.baseSalary.toLocaleString('bn-BD')}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {record.presentDays} দিন
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                    {record.overtimeHours} ঘণ্টা (৳{record.overtimeHours * record.overtimeRate})
                  </td>
                  <td className="px-4 py-3.5 text-emerald-600 font-semibold">
                    +৳{record.bonusAmount}
                  </td>
                  <td className="px-4 py-3.5 text-rose-600 font-semibold">
                    -৳{record.fineDeduction + record.advanceLoanDeduction}
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white text-sm">
                    ৳ {record.netPayable.toLocaleString('bn-BD')}
                  </td>
                  <td className="px-4 py-3.5">
                    {record.status === 'Paid' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>পরিশোধিত ({record.paymentMethod})</span>
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                          বকেয়া (Pending)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {record.status === 'Pending' && (
                      <button
                        onClick={() => onUpdatePayrollStatus(record.id, 'Paid', 'bKash')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                      >
                        বিকাশ পরিশোধ
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedPayslip(record)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 inline-flex"
                    >
                      <Printer className="w-3 h-3" />
                      <span>পে-স্লিপ</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 print:shadow-none print:w-full print:max-w-none">
            
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase">স্মার্ট হাজিরা ও পে-রোল স্লিপ</h2>
              <p className="text-xs text-slate-600 font-semibold">{orgInfo.terminology.orgCategoryName}</p>
              <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-bold mt-2 inline-block">
                মাস: {selectedPayslip.monthYear}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">নাম:</span>
                <p className="font-bold text-sm text-slate-800">{selectedPayslip.memberName}</p>
              </div>
              <div>
                <span className="text-slate-500">{orgInfo.terminology.idLabel}:</span>
                <p className="font-bold text-sm text-slate-800 font-mono">{selectedPayslip.roll}</p>
              </div>
            </div>

            {/* Payslip Details Table */}
            <div className="border rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 font-bold border-b text-slate-700">বেতন ও ভাতার বিবরণ</div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span>মূল বেতন (Base Salary)</span>
                  <span className="font-bold">৳ {selectedPayslip.baseSalary}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>ওভারটাইম ({selectedPayslip.overtimeHours} ঘণ্টা)</span>
                  <span className="font-bold">+৳ {selectedPayslip.overtimeHours * selectedPayslip.overtimeRate}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>বোনাস ও উৎসাহ ভাতা</span>
                  <span className="font-bold">+৳ {selectedPayslip.bonusAmount}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>লেট / অনুপস্থিতি জরিমানা</span>
                  <span className="font-bold">-৳ {selectedPayslip.fineDeduction}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>অগ্রিম টাকা কর্তন</span>
                  <span className="font-bold">-৳ {selectedPayslip.advanceLoanDeduction}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>মোট প্রদেয় নিট বেতন:</span>
                  <span className="text-emerald-600">৳ {selectedPayslip.netPayable.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <div>
                <span className="text-slate-500">পেমেন্ট মেথড:</span>
                <p className="font-bold text-slate-800">{selectedPayslip.paymentMethod || 'bKash'}</p>
              </div>
              <div>
                <span className="text-slate-500">স্ট্যাটাস:</span>
                <p className="font-bold text-emerald-600">{selectedPayslip.status}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 print:hidden">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={handlePrintPayslip}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট / PDF প্রাকদর্শন</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create New Payroll Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              নতুন বেতন গণনা তৈরি করুন
            </h3>

            <form onSubmit={handleCreatePayroll} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {orgInfo.terminology.memberLabel}
                </label>
                {students.length > 0 ? (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                        {s.nameBangla} ({s.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-600">কোনো কর্মী/শিক্ষার্থী তালিকাভুক্ত নেই।</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">মূল বেতন (৳)</label>
                  <input
                    type="number"
                    value={baseSalaryInput}
                    onChange={(e) => setBaseSalaryInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">উপস্থিত দিন</label>
                  <input
                    type="number"
                    value={presentDaysInput}
                    onChange={(e) => setPresentDaysInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ওভারটাইম (ঘণ্টা)</label>
                  <input
                    type="number"
                    value={overtimeHoursInput}
                    onChange={(e) => setOvertimeHoursInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ওভারটাইম রেট (৳/ঘণ্টা)</label>
                  <input
                    type="number"
                    value={overtimeRateInput}
                    onChange={(e) => setOvertimeRateInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">বোনাস (+)</label>
                  <input
                    type="number"
                    value={bonusInput}
                    onChange={(e) => setBonusInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">জরিমানা (-)</label>
                  <input
                    type="number"
                    value={fineInput}
                    onChange={(e) => setFineInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">অগ্রিম কর্তন</label>
                  <input
                    type="number"
                    value={advanceInput}
                    onChange={(e) => setAdvanceInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-center">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">হিসাবকৃত নিট প্রদেয় বেতন:</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ৳ {calculateNetPayable().toLocaleString('bn-BD')}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
