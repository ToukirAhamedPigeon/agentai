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
        
        const onMessage = (message: any) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage: SavedMessage = { 
                    role: message.role === 'assistant' ? 'assistant' : 'user', 
                    content: message.transcript 
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
            
            // Check microphone permission
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
            } catch (micError) {
                throw new Error('Microphone access is required. Please allow microphone permissions.');
            }
            
            if (type === 'generate') {
                const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
                if (!workflowId) {
                    throw new Error('Workflow ID not configured');
                }
                
                await vapi.start(workflowId, {
                    variableValues: {
                        username: userName,
                        userid: userId,
                    },
                });
            } else {
                // Use the interviewer constant and update with questions
                const assistant = JSON.parse(JSON.stringify(interviewer));
                const questionsText = questions?.length 
                    ? questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')
                    : 'Tell me about yourself.';
                
                if (assistant.model?.messages?.[0]) {
                    assistant.model.messages[0].content = 
                        `You are a professional interviewer. Ask these questions one at a time:\n\n${questionsText}\n\nKeep responses concise. After each answer, move to the next question.`;
                    assistant.model.model = "gpt-3.5-turbo";
                }
                
                await vapi.start(assistant);
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
                        className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        Try Again
                    </button>
                </div>
            )}
            
            {messages.length > 0 && callStatus === CallStatus.ACTIVE && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p className="animate-fadein opacity-100">
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
                        <span className={cn(
                            'absolute animate-ping rounded-full opacity-75',
                            callStatus !== CallStatus.CONNECTING && 'hidden'
                        )} />
                        <span>
                            {callStatus === CallStatus.CONNECTING ? 'Connecting...' : 'Start Interview'}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End Interview
                    </button>
                )}
            </div>
        </>
    );
}

export default Agent;