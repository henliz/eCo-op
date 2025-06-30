// Add this debug component to your plan page to diagnose the issue

'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthDebugInfo {
  hasUser: boolean;
  hasToken: boolean;
  tokenValid: boolean;
  tokenExpiry: string | null;
  storageToken: boolean;
  storageUser: boolean;
  lastApiCall: string | null;
}

export function AuthDebugPanel() {
  const { currentUser, accessToken } = useAuth();
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string>('');

  const isTokenValid = (token: string): boolean => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch (error) {
      return false;
    }
  };

  const getTokenExpiry = (token: string): string | null => {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        return new Date(payload.exp * 1000).toISOString();
      }
    } catch (error) {
      return 'Invalid token';
    }
    return null;
  };

  const testApiCall = async () => {
    try {
      setApiTestResult('Testing...');
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/profile`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setApiTestResult(`✅ API Success: ${response.status}`);
      } else {
        setApiTestResult(`❌ API Failed: ${response.status} - ${data.error || data.message}`);
      }
    } catch (error: any) {
      setApiTestResult(`💥 Network Error: ${error.message}`);
    }
  };

  useEffect(() => {
    const info: AuthDebugInfo = {
      hasUser: !!currentUser,
      hasToken: !!accessToken,
      tokenValid: accessToken ? isTokenValid(accessToken) : false,
      tokenExpiry: accessToken ? getTokenExpiry(accessToken) : null,
      storageToken: !!localStorage.getItem('accessToken'),
      storageUser: !!localStorage.getItem('user'),
      lastApiCall: null
    };
    
    setDebugInfo(info);
  }, [currentUser, accessToken]);

  if (!debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm text-xs">
      <h3 className="font-bold text-sm mb-2 text-red-600">🔍 Auth Debug Panel</h3>
      
      <div className="space-y-1">
        <div className={`flex justify-between ${debugInfo.hasUser ? 'text-green-600' : 'text-red-600'}`}>
          <span>Current User:</span>
          <span>{debugInfo.hasUser ? '✅' : '❌'}</span>
        </div>
        
        <div className={`flex justify-between ${debugInfo.hasToken ? 'text-green-600' : 'text-red-600'}`}>
          <span>Access Token:</span>
          <span>{debugInfo.hasToken ? '✅' : '❌'}</span>
        </div>
        
        <div className={`flex justify-between ${debugInfo.tokenValid ? 'text-green-600' : 'text-red-600'}`}>
          <span>Token Valid:</span>
          <span>{debugInfo.tokenValid ? '✅' : '❌'}</span>
        </div>
        
        <div className={`flex justify-between ${debugInfo.storageToken ? 'text-green-600' : 'text-red-600'}`}>
          <span>Storage Token:</span>
          <span>{debugInfo.storageToken ? '✅' : '❌'}</span>
        </div>
        
        <div className={`flex justify-between ${debugInfo.storageUser ? 'text-green-600' : 'text-red-600'}`}>
          <span>Storage User:</span>
          <span>{debugInfo.storageUser ? '✅' : '❌'}</span>
        </div>
        
        {debugInfo.tokenExpiry && (
          <div className="text-xs text-gray-600 mt-2">
            <div>Token Expires:</div>
            <div className="break-all">{debugInfo.tokenExpiry}</div>
          </div>
        )}
        
        <div className="mt-3 pt-2 border-t border-gray-200">
          <button 
            onClick={testApiCall}
            className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            Test API Call
          </button>
          
          {apiTestResult && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all">
              {apiTestResult}
            </div>
          )}
        </div>
        
        {currentUser && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            <div>Email: {currentUser.email}</div>
            <div>ID: {currentUser.uid}</div>
          </div>
        )}
      </div>
    </div>
  );
}