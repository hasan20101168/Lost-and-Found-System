import { useContext } from "react";
import { SocketContext } from "./socketContextCore";

export const useSocket = () =>
  useContext(SocketContext);
