import { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { CreditCard, Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch subscriptions from API
    // For now, using mock data
    setSubscriptions([]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage your subscription plans and billing</p>
        </div>
        <Button
          onClick={() => {
            toast.success('Add subscription feature coming soon');
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.colors.primary.main }}></div>
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.background.tertiary} 0%, rgba(0,168,232,0.1) 100%)`
              }}
            >
              <CreditCard className="w-10 h-10" style={{ color: theme.colors.primary.main }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscriptions yet</h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              Get started by adding your first subscription plan. Manage billing cycles, payment methods, and more.
            </p>
            <Button
              onClick={() => {
                toast.success('Add subscription feature coming soon');
              }}
            >
              Add First Subscription
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.background.tertiary }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{subscription.name}</h3>
                    <p className="text-sm text-gray-500">{subscription.plan}</p>
                  </div>
                </div>
                {subscription.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : subscription.status === 'expired' ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">₹{subscription.amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="font-medium text-gray-900">{subscription.billingCycle}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Next Billing:</span>
                  <span className="font-medium text-gray-900">{subscription.nextBilling}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    toast.success('View subscription details coming soon');
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    toast.success('Edit subscription coming soon');
                  }}
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

