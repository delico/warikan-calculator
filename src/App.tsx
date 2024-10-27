import React, { useState } from 'react';
import { PlusCircle, Receipt, Users, Calculator, Trash2 } from 'lucide-react';

interface Participant {
  name: string;
  weight: number;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  description: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const addParticipant = () => {
    if (newParticipant.trim() && !participants.some(p => p.name === newParticipant.trim())) {
      setParticipants([...participants, { name: newParticipant.trim(), weight: 1 }]);
      setNewParticipant('');
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter(p => p.name !== name));
    setExpenses(expenses.filter(e => e.name !== name));
  };

  const updateWeight = (name: string, weight: number) => {
    setParticipants(participants.map(p => 
      p.name === name ? { ...p, weight: Math.max(0.1, weight) } : p
    ));
  };

  const addExpense = (name: string, amount: number, description: string) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      name,
      amount,
      description,
    };
    setExpenses([...expenses, newExpense]);
  };

  const calculateSettlements = () => {
    if (participants.length === 0) return;

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalWeights = participants.reduce((sum, p) => sum + p.weight, 0);
    
    // Calculate how much each person should pay based on their weight
    const expectedPayments = new Map<string, number>();
    participants.forEach(p => {
      const share = (p.weight / totalWeights) * totalAmount;
      expectedPayments.set(p.name, share);
    });

    // Calculate actual payments
    const actualPayments = new Map<string, number>();
    participants.forEach(p => actualPayments.set(p.name, 0));
    expenses.forEach(expense => {
      actualPayments.set(expense.name, (actualPayments.get(expense.name) || 0) + expense.amount);
    });

    // Calculate balances
    const balances = new Map<string, number>();
    participants.forEach(p => {
      const expected = expectedPayments.get(p.name) || 0;
      const actual = actualPayments.get(p.name) || 0;
      balances.set(p.name, actual - expected);
    });

    // Calculate settlements
    const newSettlements: Settlement[] = [];
    const debtors = Array.from(balances.entries())
      .filter(([_, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1]);
    const creditors = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1]);

    let dIndex = 0;
    let cIndex = 0;

    while (dIndex < debtors.length && cIndex < creditors.length) {
      const [debtor, debtAmount] = debtors[dIndex];
      const [creditor, creditAmount] = creditors[cIndex];
      
      const amount = Math.min(Math.abs(debtAmount), creditAmount);
      
      if (amount > 0) {
        newSettlements.push({
          from: debtor,
          to: creditor,
          amount: Math.round(amount * 100) / 100,
        });
      }

      if (Math.abs(debtAmount) === creditAmount) {
        dIndex++;
        cIndex++;
      } else if (Math.abs(debtAmount) < creditAmount) {
        creditors[cIndex][1] -= Math.abs(debtAmount);
        dIndex++;
      } else {
        debtors[dIndex][1] += creditAmount;
        cIndex++;
      }
    }

    setSettlements(newSettlements);
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalWeights = participants.reduce((sum, p) => sum + p.weight, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-indigo-900">割り勘計算アプリ</h1>
          <p className="text-gray-600 mt-2">支払いを簡単に清算しましょう</p>
        </header>

        {/* 参加者追加セクション */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">参加者</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              placeholder="参加者の名前"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
            />
            <button
              onClick={addParticipant}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              追加
            </button>
          </div>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.name}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-800 flex-1">
                  {participant.name}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">負担割合:</label>
                  <input
                    type="number"
                    value={participant.weight}
                    onChange={(e) => updateWeight(participant.name, parseFloat(e.target.value))}
                    min="0.1"
                    step="0.1"
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={() => removeParticipant(participant.name)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {participants.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              {participants.map(p => (
                <div key={p.name}>
                  {p.name}: {Math.round((p.weight / totalWeights) * 100)}% (
                  予定負担額: ¥{Math.round((p.weight / totalWeights) * totalAmount).toLocaleString()})
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 支払い追加セクション */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">支払い記録</h2>
          </div>
          <ExpenseForm
            participants={participants.map(p => p.name)}
            onSubmit={addExpense}
          />
          <div className="mt-6 space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{expense.name}</p>
                  <p className="text-sm text-gray-600">{expense.description}</p>
                </div>
                <p className="font-semibold text-indigo-600">¥{expense.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 清算ボタン */}
        <div className="text-center">
          <button
            onClick={calculateSettlements}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Calculator className="w-5 h-5" />
            清算計算
          </button>
        </div>

        {/* 清算結果 */}
        {settlements.length > 0 && (
          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">清算方法</h2>
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="p-4 bg-green-50 rounded-lg text-green-800"
                >
                  <p>
                    <span className="font-medium">{settlement.from}</span> さんから
                    <span className="font-medium">{settlement.to}</span> さんへ
                    <span className="font-bold"> ¥{settlement.amount.toLocaleString()}</span> お支払い
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ExpenseForm({ participants, onSubmit }: {
  participants: string[];
  onSubmit: (name: string, amount: number, description: string) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && amount && description) {
      onSubmit(name, Number(amount), description);
      setAmount('');
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">支払った人</option>
          {participants.map((participant) => (
            <option key={participant} value={participant}>
              {participant}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="金額"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="内容（例：お寿司、ドリンクなど）"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        支払いを追加
      </button>
    </form>
  );
}

export default App;