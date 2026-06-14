import { useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  disconnectSocket,
  getSocket
} from "../services/socketService";
import { SocketContext } from "./socketContextCore";

export const SocketProvider = ({
  children
}) => {
  const { user } = useAuth();

  const socket = useMemo(() => {
    if (!user) {
      disconnectSocket();
      return null;
    }

    return getSocket();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
