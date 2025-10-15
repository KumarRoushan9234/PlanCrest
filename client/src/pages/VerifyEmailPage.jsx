import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const VerifyEmailPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { verifyEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      alert('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(email, verificationCode);
      navigate('/login', { state: { message: 'Email verified successfully! You can now sign in.' } });
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    try {
      // You would need to add a resend verification endpoint to your backend
      // For now, we'll just show a message
      alert('Verification code resent! Please check your email.');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error) {
      console.error('Resend error:', error);
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setVerificationCode(value);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </button>
          
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-white">
            Verify Your Email
          </h2>
          <p className="mt-2 text-gray-400">
            We've sent a verification code to
          </p>
          <p className="text-blue-400 font-medium">
            {email}
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Verification Code Field */}
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300 mb-2">
                Enter Verification Code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={handleCodeChange}
                className="w-full px-4 py-4 text-center text-2xl font-mono border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ABC123"
                maxLength="6"
                autoComplete="off"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-400 text-center">
                Enter the 6-character code sent to your email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verify Email
                </div>
              )}
            </button>
          </form>

          {/* Resend Code Section */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-4">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={resendLoading || resendCooldown > 0}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </div>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend verification code'
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">
            Need Help?
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Check your spam/junk folder</p>
            <p>• Make sure the email address is correct</p>
            <p>• The code expires in 10 minutes</p>
            <p>• Contact support if you continue having issues</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            By verifying your email, you agree to our{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
