'use client'

import { cn } from '@/lib/utils';
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { vapi } from '@/lib/vapi.sdk'
import { interviewer } from '@/constants';
import { createFeedback } from '@/lib/actions/general.action';

enum CallStatus{
    INACTIVE='INACTIVE',
    CONNECTING='CONNECTING',
    ACTIVE='ACTIVE',
    FINISHED='FINISHED'
}

interface SavedMessage{
    role: 'user' | 'system' | 'assistant';
    content: string;
}

// Define a type for VAPI message
interface VapiMessage {
    type: string;
    transcriptType?: string;
    role?: string;
    transcript?: string;
}

const Agent = ({userName, userId, type, interviewId, questions}: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onCallStart = () => {
            console.log('Call started');
            setCallStatus(CallStatus.ACTIVE);
            setError(null);
        };
        
        const onCallEnd = () => {
            console.log('Call ended');
            setCallStatus(CallStatus.FINISHED);
        };
        
        const onMessage = (message: VapiMessage) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                // Fix: Ensure role is one of the allowed types
                let role: 'user' | 'system' | 'assistant' = 'user';
                if (message.role === 'assistant') {
                    role = 'assistant';
                } else if (message.role === 'system') {
                    role = 'system';
                } else {
                    role = 'user';
                }
                
                const newMessage: SavedMessage = { 
                    role: role, 
                    content: message.transcript || '' 
                };
                setMessages((prev) => [...prev, newMessage]);
            }
        };
        
        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => {
            console.error('VAPI Error:', error);
            setError(error.message);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError);
        };
    }, []);

    useEffect(() => {
        if (callStatus === CallStatus.FINISHED && messages.length > 0) {
            if (type === 'generate') {
                router.push('/');
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [callStatus, messages]);

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log('Generating feedback...');
        try {
            const { success, feedbackId: id } = await createFeedback({
                interviewId: interviewId!,
                userId: userId!,
                transcript: messages
            });
            if (success && id) {
                router.push(`/interview/${interviewId}/feedback`);
            } else {
                console.log('Error saving Feedback');
                router.push('/');
            }
        } catch (error) {
            console.error('Feedback error:', error);
            router.push('/');
        }
    };

    const handleCall = async () => {
        try {
            setCallStatus(CallStatus.CONNECTING);
            setError(null);
            
            // Check microphone permission first
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (micError) {
                throw new Error('Microphone access is required for the interview. Please allow microphone permissions and try again.');
            }
            
            if (type === 'generate') {
                const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
                if (!workflowId) {
                    throw new Error('VAPI workflow ID not configured');
                }
                
                await vapi.start(workflowId, {
                    variableValues: {
                        username: userName,
                        userid: userId,
                    },
                });
            } else {
                // Create a deep copy of the interviewer object
                const assistantConfig = JSON.parse(JSON.stringify(interviewer));
                
                // Update the system message content with questions
                if (assistantConfig.model && assistantConfig.model.messages && assistantConfig.model.messages[0]) {
                    const questionsText = questions?.length 
                        ? questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')
                        : 'Tell me about yourself and your experience.';
                    
                    assistantConfig.model.messages[0].content = 
                        `You are a professional job interviewer. Ask these questions one at a time:\n\n${questionsText}\n\nKeep responses short and natural. After each answer, move to the next question.`;
                }
                
                // Ensure model is using gpt-3.5-turbo for better compatibility
                if (assistantConfig.model) {
                    assistantConfig.model.model = "gpt-3.5-turbo";
                }
                
                console.log('Starting assistant with questions:', questions?.length);
                await vapi.start(assistantConfig);
            }
        } catch (error: any) {
            console.error('Failed to start call:', error);
            setError(error.message || 'Failed to start the interview. Please try again.');
            setCallStatus(CallStatus.INACTIVE);
        }
    };
    
    const handleDisconnect = async () => {
        try {
            vapi.stop();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
        setCallStatus(CallStatus.FINISHED);
    };

    const latestMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;
    
    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover"/>
                        {isSpeaking && <span className="animate-speak"/>}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>
                <div className="card-border">
                    <div className="card-content">
                        <Image src="/user-avatar.png" alt="user avatar" width={540} height={540} className="rounded-full object-cover size-[120px]"/>
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="text-red-500 text-center mt-4 p-4 bg-red-50 rounded-lg max-w-md mx-auto">
                    <p className="font-semibold mb-2">Error</p>
                    <p className="text-sm">{error}</p>
                    <button 
                        onClick={handleCall} 
                        className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
            
            {messages.length > 0 && callStatus === CallStatus.ACTIVE && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadein opacity-100')}>
                            {latestMessage}
                        </p>
                    </div>
                </div>
            )}
            
            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button 
                        className="relative btn-call" 
                        onClick={handleCall}
                        disabled={callStatus === CallStatus.CONNECTING}
                    >
                        <span
                            className={cn(
                                'absolute animate-ping rounded-full opacity-75',
                                callStatus !== CallStatus.CONNECTING && 'hidden'
                            )}
                        />
                        <span>
                            {callStatus === CallStatus.CONNECTING ? 'Connecting...' : 
                             isCallInactiveOrFinished ? 'Start Interview' : 'Retry'}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End Interview
                    </button>
                )}
            </div>
            
            {callStatus === CallStatus.ACTIVE && (
                <div className="text-center text-sm text-gray-500 mt-4">
                    Interview in progress. Speak naturally with the AI interviewer.
                </div>
            )}
        </>
    );
}

export default Agent;