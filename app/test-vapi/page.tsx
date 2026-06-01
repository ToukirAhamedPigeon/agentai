'use client';

import { useState } from 'react';
import { vapi } from '@/lib/vapi.sdk';

export default function TestVapi() {
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState<string | null>(null);

    const testWorkflow = async () => {
        try {
            setStatus('starting...');
            setError(null);
            
            // Request mic permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
            console.log('Using workflow ID:', workflowId);
            
            if (!workflowId) {
                throw new Error('Workflow ID not configured');
            }
            
            await vapi.start(workflowId, {
                variableValues: {
                    username: "Test User",
                    userid: "test123",
                },
            });
            
            setStatus('connected');
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    const testAssistant = async () => {
        try {
            setStatus('starting assistant...');
            setError(null);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            // Create a properly typed assistant configuration with all literal types
            const assistant = {
                name: "Test Assistant",
                firstMessage: "Hello! This is a test call. Can you hear me?",
                transcriber: {
                    provider: "deepgram" as const,
                    model: "nova-2" as const,
                    language: "en" as const  // Must be exact literal, not just string
                },
                voice: {
                    provider: "11labs" as const,
                    voiceId: "sarah" as const,
                    stability: 0.4,
                    similarityBoost: 0.8,
                    speed: 0.9,
                    style: 0.5,
                    useSpeakerBoost: true
                },
                model: {
                    provider: "openai" as const,
                    model: "gpt-3.5-turbo" as const,
                    temperature: 0.7,
                    messages: [
                        {
                            role: "system" as const,
                            content: "You are a test assistant. Ask the user if they can hear you clearly."
                        }
                    ]
                }
            };
            
            console.log('Starting assistant with config:', assistant);
            await vapi.start(assistant);
            setStatus('connected');
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    // Alternative: Use type assertion to bypass strict checking
    const testAssistantSimple = async () => {
        try {
            setStatus('starting assistant...');
            setError(null);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            const assistant = {
                name: "Test Assistant",
                firstMessage: "Hello! This is a test call. Can you hear me?",
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                voice: {
                    provider: "11labs",
                    voiceId: "sarah",
                    stability: 0.4,
                    similarityBoost: 0.8,
                    speed: 0.9,
                    style: 0.5,
                    useSpeakerBoost: true
                },
                model: {
                    provider: "openai",
                    model: "gpt-3.5-turbo",
                    temperature: 0.7,
                    messages: [
                        {
                            role: "system",
                            content: "You are a test assistant. Ask the user if they can hear you clearly."
                        }
                    ]
                }
            };
            
            // Use 'as any' to bypass TypeScript checking
            console.log('Starting assistant with config:', assistant);
            await vapi.start(assistant as any);
            setStatus('connected');
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    const stopCall = () => {
        vapi.stop();
        setStatus('idle');
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">VAPI Test Page</h1>
            
            <div className="space-y-4">
                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Test Workflow</h2>
                    <button 
                        onClick={testWorkflow}
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                        disabled={status === 'starting...'}
                    >
                        Start Workflow
                    </button>
                </div>
                
                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Test Assistant (Strict Types)</h2>
                    <button 
                        onClick={testAssistant}
                        className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                        disabled={status === 'starting assistant...'}
                    >
                        Start Assistant (Strict)
                    </button>
                </div>

                <div className="border p-4 rounded">
                    <h2 className="font-semibold mb-2">Test Assistant (Simple - Use this first)</h2>
                    <button 
                        onClick={testAssistantSimple}
                        className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
                        disabled={status === 'starting assistant...'}
                    >
                        Start Assistant (Simple)
                    </button>
                </div>
                
                {status === 'connected' && (
                    <div className="border p-4 rounded bg-green-50">
                        <p className="text-green-700 mb-2">Call in progress...</p>
                        <button 
                            onClick={stopCall}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                            End Call
                        </button>
                    </div>
                )}
                
                {error && (
                    <div className="border border-red-400 bg-red-50 p-4 rounded">
                        <p className="text-red-700 font-semibold">Error:</p>
                        <p className="text-red-600">{error}</p>
                    </div>
                )}
                
                <div className="border p-4 rounded bg-gray-50">
                    <h2 className="font-semibold mb-2">Debug Info:</h2>
                    <p>Status: {status}</p>
                    <p>Public Key: {process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.substring(0, 8)}...</p>
                    <p>Workflow ID: {process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID}</p>
                </div>
            </div>
        </div>
    );
}