import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, CheckCircle, User, Building2, FolderKanban } from 'lucide-react';
import connectorService from '../../services/connectorService';

const AccountSelector = ({ 
  type, 
  selectedAccount, 
  onAccountChange, 
  onAddAccount,
  showAddButton = true 
}) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [type]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      
      // Fetch all connectors of this type across all scopes
      const scopes = ['personal', 'workspace', 'project'];
      const allAccounts = [];
      
      for (const scope of scopes) {
        try {
          const { connectors } = await connectorService.getAllConnectors(scope, null);
          const scopeConnectors = connectors?.filter((c) => c.type === type) || [];
          
          scopeConnectors.forEach((connector) => {
            allAccounts.push({
              ...connector,
              displayName: `${getScopeIcon(scope)} ${connector.metadata?.userInfo?.email || connector.config?.email || 'Unknown'}`,
              scopeLabel: scope.charAt(0).toUpperCase() + scope.slice(1),
            });
          });
        } catch (err) {
          console.error(`Error fetching ${scope} connectors:`, err);
        }
      }
      
      setAccounts(allAccounts);
      
      // Auto-select first account if none selected
      if (allAccounts.length > 0 && !selectedAccount) {
        onAccountChange(allAccounts[0]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'personal':
        return '👤';
      case 'workspace':
        return '🏢';
      case 'project':
        return '📁';
      default:
        return '🔗';
    }
  };

  const getScopeIconComponent = (scope) => {
    switch (scope) {
      case 'personal':
        return <User className="w-4 h-4" />;
      case 'workspace':
        return <Building2 className="w-4 h-4" />;
      case 'project':
        return <FolderKanban className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-700/30 rounded-lg h-12 w-full" />
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <p className="text-sm text-gray-400 mb-3">No accounts connected yet</p>
        {showAddButton && (
          <button
            onClick={onAddAccount}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-400 mb-2">
        Connected Account
      </label>
      
      <div className="flex gap-2">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            {getScopeIconComponent(selectedAccount?.scope)}
            <div className="text-left">
              <p className="text-sm font-medium text-white">
                {selectedAccount?.metadata?.userInfo?.email || selectedAccount?.config?.email || 'Select Account'}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {selectedAccount?.scopeLabel || selectedAccount?.scope || 'No scope'}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {showAddButton && (
          <button
            onClick={onAddAccount}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
            title="Add another account"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <button
                  key={account._id}
                  onClick={() => {
                    onAccountChange(account);
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700/50 transition-colors text-left border-b border-gray-700/50 last:border-b-0"
                >
                  {getScopeIconComponent(account.scope)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {account.metadata?.userInfo?.email || account.config?.email}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {account.scopeLabel}
                    </p>
                  </div>
                  {selectedAccount?._id === account._id && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountSelector;

