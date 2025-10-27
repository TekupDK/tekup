import { formatCurrency, formatHours } from '../../../shared/utils';
import type { FBSettlement } from '../../../shared/types';

interface FBSettlementCardProps {
  settlement: FBSettlement;
}

export function FBSettlementCard({ settlement }: FBSettlementCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          FB Rengøring Settlement
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          settlement.paid
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {settlement.paid ? 'Paid' : 'Pending'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatHours(settlement.totalHours)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Hours</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(settlement.hourlyRate)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Per Hour</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(settlement.totalAmount)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Payment</div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Month:</span>
          <span className="font-medium">
            {new Date(settlement.month).toLocaleDateString('da-DK', {
              year: 'numeric',
              month: 'long'
            })}
          </span>
        </div>

        {settlement.paid && settlement.paidAt && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Paid on:</span>
            <span className="font-medium">
              {new Date(settlement.paidAt).toLocaleDateString('da-DK')}
            </span>
          </div>
        )}
      </div>

      {!settlement.paid && (
        <div className="mt-6">
          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            Mark as Paid
          </button>
        </div>
      )}
    </div>
  );
}