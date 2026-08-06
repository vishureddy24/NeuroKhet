"use client";

import { useState } from 'react';
import { Camera, TrendingUp, FileText, Mic, X, User, Settings, History, Calendar, Globe } from 'lucide-react';
import CropDiagnosis from './CropDiagnosis';
import VaaniAssistant from './VaaniAssistant';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
}

export default function Dashboard({ isOpen, onClose, userEmail }: DashboardProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'crop-diagnosis',
      title: 'Crop Diagnosis',
      description: 'AI-powered disease identification',
      icon: Camera,
      color: 'green',
      stats: '95% Accuracy',
      bgGradient: 'from-green-400 to-green-600'
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Real-time price tracking',
      icon: TrendingUp,
      color: 'blue',
      stats: 'Live Data',
      bgGradient: 'from-blue-400 to-blue-600'
    },
    {
      id: 'scheme-navigator',
      title: 'Government Schemes',
      description: 'Find and apply for subsidies',
      icon: FileText,
      color: 'purple',
      stats: '500+ Schemes',
      bgGradient: 'from-purple-400 to-purple-600'
    },
    {
      id: 'vaani-assistant',
      title: 'Vaani Assistant',
      description: 'Voice-first AI companion',
      icon: Mic,
      color: 'purple',
      stats: '12+ Languages',
      bgGradient: 'from-purple-500 to-pink-500'
    }
  ];

  const recentActivity = [
    { type: 'diagnosis', crop: 'Tomato', disease: 'Late Blight', date: '2 hours ago' },
    { type: 'market', crop: 'Wheat', price: '₹2,150/quintal', date: '5 hours ago' },
    { type: 'scheme', name: 'PM-KUSUM Solar', status: 'Applied', date: '1 day ago' }
  ];

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center z-50 p-4"
        onClick={handleBackgroundClick}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">NeuroKheti Dashboard</h2>
                <p className="text-gray-600">Welcome back, {userEmail?.split('@')[0]}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">12+ Languages</span>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Vaani Voice Assistant Banner - Prominent placement */}
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">वा</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-purple-900 mb-1">Welcome to Vaani - Your Personal AI Assistant</h3>
                  <p className="text-purple-700 text-sm mb-3">
                    Speak naturally in Hindi, Kannada, Telugu, or any Indian language. Get instant farming advice through voice!
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-purple-600">
                    <span className="flex items-center space-x-1">
                      <Mic className="w-3 h-3" />
                      <span>Voice Recognition</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>12+ Languages</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>🧠</span>
                      <span>AI-Powered</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveFeature('vaani-assistant')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 font-semibold"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Talking</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Analyses Today</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Camera className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Price Alerts</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Active Schemes</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Voice Queries</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <Mic className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Features */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-6">AI-Powered Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature) => {
                    const IconComponent = feature.icon;
                    const isVaani = feature.id === 'vaani-assistant';
                    
                    return (
                      <div
                        key={feature.id}
                        onClick={() => setActiveFeature(feature.id)}
                        className={`bg-white rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200 cursor-pointer hover:-translate-y-1 ${
                          isVaani ? 'border-purple-200 ring-2 ring-purple-100' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${feature.bgGradient} rounded-lg flex items-center justify-center mr-4`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              {feature.title}
                              {isVaani && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">NEW</span>}
                            </h4>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${feature.color}-100 text-${feature.color}-800`}>
                            {feature.stats}
                          </span>
                          <div className="flex items-center space-x-2">
                            {(feature.id === 'crop-diagnosis' || feature.id === 'vaani-assistant') && (
                              <div className="flex items-center space-x-1">
                                <Globe className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">12+ Languages</span>
                              </div>
                            )}
                            <button className={`text-${feature.color}-600 hover:text-${feature.color}-700 font-medium text-sm`}>
                              Open →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar - Updated Quick Actions */}
              <div className="space-y-6">
                {/* Quick Actions - Vaani prominent */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Quick Actions</h4>
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveFeature('vaani-assistant')}
                      className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors flex items-center border border-purple-200"
                    >
                      <Mic className="w-4 h-4 text-purple-600 mr-3" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-purple-900">Talk to Vaani</span>
                        <p className="text-xs text-purple-600">Voice assistant ready</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveFeature('crop-diagnosis')}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Camera className="w-4 h-4 text-green-600 mr-3" />
                      <span className="text-sm text-gray-700">Quick Diagnosis</span>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">Check Prices</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center mb-4">
                    <History className="w-5 h-5 text-gray-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'diagnosis' ? 'bg-green-500' :
                          activity.type === 'market' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.type === 'diagnosis' && `${activity.crop} - ${activity.disease}`}
                            {activity.type === 'market' && `${activity.crop} - ${activity.price}`}
                            {activity.type === 'scheme' && `${activity.name} - ${activity.status}`}
                          </p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Components - Include Vaani */}
      <CropDiagnosis 
        isOpen={activeFeature === 'crop-diagnosis'} 
        onClose={() => setActiveFeature(null)} 
      />
      
      <VaaniAssistant 
        isOpen={activeFeature === 'vaani-assistant'} 
        onClose={() => setActiveFeature(null)} 
      />
    </>
  );
}
