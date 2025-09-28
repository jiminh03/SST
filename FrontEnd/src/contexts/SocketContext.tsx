import React, { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: (serverUrl: string, jwt: string) => void;
  disconnectSocket: () => void;
  addEventListener: (event: string, callback: (...args: any[]) => void) => void;
  removeEventListener: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const connectSocket = (serverUrl: string, jwt: string) => {
    console.log('🔍 SocketContext: connectSocket 호출됨', { 
      serverUrl, 
      jwt: jwt ? '토큰 있음' : '토큰 없음',
      currentSocket: socketRef.current ? '있음' : '없음',
      isConnected 
    });
    
    // 이미 연결된 Socket이 있으면 그대로 사용
    if (socketRef.current && socketRef.current.connected && socketRef.current.id) {
      console.log('✅ 기존 Socket 연결 재사용:', socketRef.current.id);
      setIsConnected(true);
      setSocket(socketRef.current);
      return;
    }

    // Socket이 없으면 새로 생성
    if (!socketRef.current) {
      console.log('🚀 Creating new Socket.IO connection...');
      const newSocket = io(serverUrl, {
        auth: { token: jwt },
        transports: ['websocket']
      });

      socketRef.current = newSocket;
      
      // 즉시 Socket 상태 업데이트
      setSocket(newSocket);
      
      // 연결 완료를 기다림
      newSocket.on('connect', () => {
        console.log('✅ Socket.IO 연결 성공:', newSocket.id);
        console.log('🔍 Socket 연결 정보:', {
          id: newSocket.id,
          connected: newSocket.connected,
          transport: newSocket.io.engine.transport.name
        });
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket.IO 연결 끊김');
        setIsConnected(false);
        setSocket(null);
      });

      // 연결 오류 핸들러
      newSocket.on('connect_error', (error) => {
        console.log('❌ Socket.IO 연결 오류:', error);
        setIsConnected(false);
        setSocket(null);
      });

      // 연결 시도 중
      newSocket.on('connecting', () => {
        console.log('🔄 Socket.IO 연결 시도 중...');
      });

      // 모든 이벤트 로깅 (디버깅용)
      const originalEmit = newSocket.emit;
      newSocket.emit = function(event: string, ...args: any[]) {
        console.log(`📤 Socket 이벤트 전송: ${event}`, args);
        return originalEmit.apply(this, [event, ...args]);
      };

      // 모든 수신 이벤트 로깅
      const originalOn = newSocket.on;
      newSocket.on = function(event: string, callback: (...args: any[]) => void) {
        console.log(`📥 Socket 이벤트 리스너 등록: ${event}`);
        return originalOn.call(this, event, (...args: any[]) => {
          console.log(`📨 Socket 이벤트 수신: ${event}`, args);
          return callback(...args);
        });
      };
    }
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  const addEventListener = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      console.log(`🎧 이벤트 리스너 등록: ${event}`, {
        socketId: socketRef.current.id,
        connected: socketRef.current.connected
      });
      socketRef.current.on(event, callback);
      
      // 등록된 이벤트 리스너 수 확인
      const listeners = socketRef.current.listeners(event);
      console.log(`📊 ${event} 이벤트 리스너 수: ${listeners.length}`);
    } else {
      console.log(`⚠️ Socket이 없어서 이벤트 리스너 등록 실패: ${event}`);
    }
  };

  const removeEventListener = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const emit = (event: string, ...args: any[]) => {
    if (socketRef.current) {
      socketRef.current.emit(event, ...args);
    }
  };

  const value: SocketContextType = {
    socket: socket,
    isConnected,
    connectSocket,
    disconnectSocket,
    addEventListener,
    removeEventListener,
    emit
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};