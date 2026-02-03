import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Calculator, X, Info } from 'lucide-react';
import { motion } from 'motion/react';

type BudgetRatio = {
  name: string;
  ratio: [number, number, number]; // [kebutuhan, keinginan, tabungan]
  description: string;
  icon: string;
};

const budgetRatios: BudgetRatio[] = [
  {
    name: '50/30/20',
    ratio: [50, 30, 20],
    description: 'Klasik & Seimbang: 50% kebutuhan, 30% keinginan, 20% tabungan',
    icon: '⚖️',
  },
  {
    name: '60/20/20',
    ratio: [60, 20, 20],
    description: 'Konservatif: 60% kebutuhan, 20% keinginan, 20% tabungan',
    icon: '🛡️',
  },
  {
    name: '70/20/10',
    ratio: [70, 20, 10],
    description: 'Prioritas Kebutuhan: 70% kebutuhan, 20% keinginan, 10% tabungan',
    icon: '🏠',
  },
  {
    name: '50/20/30',
    ratio: [50, 20, 30],
    description: 'Fokus Tabungan: 50% kebutuhan, 20% keinginan, 30% tabungan',
    icon: '💎',
  },
  {
    name: '40/30/30',
    ratio: [40, 30, 30],
    description: 'Aggressive Saving: 40% kebutuhan, 30% keinginan, 30% tabungan',
    icon: '🚀',
  },
];

export function BudgetCalculator() {
  const [income, setIncome] = useState('');
  const [selectedRatio, setSelectedRatio] = useState(budgetRatios[0]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const calculateBudget = () => {
    const incomeAmount = parseFloat(income) || 0;
    return {
      needs: (incomeAmount * selectedRatio.ratio[0]) / 100,
      wants: (incomeAmount * selectedRatio.ratio[1]) / 100,
      savings: (incomeAmount * selectedRatio.ratio[2]) / 100,
    };
  };

  const budget = calculateBudget();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="space-y-4">

        {/* Income input */}
        <Card className="p-4 backdrop-blur-xl bg-white/70 dark:bg-black/40 border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg">
          <Label htmlFor="calc-income" className="text-gray-700 dark:text-gray-200 font-medium mb-2 block">
            Penghasilan Bulanan
          </Label>
          <Input
            id="calc-income"
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Masukkan penghasilan"
            className="bg-white/80 dark:bg-black/50 border-pink-200/50 dark:border-pink-800/30 text-lg"
          />
        </Card>

        {/* Ratio selection */}
        <Card className="p-4 backdrop-blur-xl bg-white/70 dark:bg-black/40 border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg">
          <Label className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 mb-3">
            Pilih Rasio Budget
            <Info className="w-4 h-4 text-gray-500" />
          </Label>
          <div className="space-y-2">
            {budgetRatios.map((ratio) => (
              <motion.button
                key={ratio.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRatio(ratio)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedRatio.name === ratio.name
                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-lg'
                    : 'bg-pink-50/50 dark:bg-pink-900/10 hover:bg-pink-100/60 dark:hover:bg-pink-900/20 text-gray-800 dark:text-white border-2 border-pink-200/40 dark:border-pink-800/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{ratio.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{ratio.name}</p>
                    <p className={`text-xs ${
                      selectedRatio.name === ratio.name
                        ? 'text-white/90'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {ratio.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Results */}
        {income && parseFloat(income) > 0 && (
          <Card className="p-4 backdrop-blur-xl bg-white/70 dark:bg-black/40 border-2 border-pink-200/50 dark:border-pink-800/30 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Hasil Perhitungan:</h3>
            
            {/* Needs */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-500/20 dark:from-blue-600/20 dark:to-blue-700/20 border border-white/30 dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  🏠 Kebutuhan ({selectedRatio.ratio[0]}%)
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(budget.needs)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Untuk biaya hidup esensial: sewa, makanan, transport, tagihan
              </p>
            </div>

            {/* Wants */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 dark:from-purple-600/20 dark:to-pink-700/20 border border-white/30 dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  🎉 Keinginan ({selectedRatio.ratio[1]}%)
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(budget.wants)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Untuk hiburan, makan di luar, hobi, shopping
              </p>
            </div>

            {/* Savings */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 dark:from-green-600/20 dark:to-emerald-700/20 border border-white/30 dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  💰 Tabungan & Investasi ({selectedRatio.ratio[2]}%)
                </p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(budget.savings)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Untuk masa depan, dana darurat, investasi
              </p>
            </div>
            </motion.div>
          </Card>
        )}

        {/* Insight box */}
        <Card className="p-4 backdrop-blur-xl bg-gradient-to-r from-pink-200/40 via-rose-200/40 to-pink-200/40 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-pink-900/20 border-2 border-pink-300/50 dark:border-pink-800/30 shadow-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-pink-700 dark:text-pink-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-1">💡 Tips Memilih Rasio:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Pilih 50/30/20 jika kamu baru mulai mengelola keuangan</li>
                <li>Pilih 50/20/30 atau 40/30/30 jika ingin fokus menabung lebih banyak</li>
                <li>Pilih 70/20/10 jika biaya hidup kamu tinggi atau pendapatan terbatas</li>
                <li>Sesuaikan dengan kondisi finansial dan tujuan kamu!</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}