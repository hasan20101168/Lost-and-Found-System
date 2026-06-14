import api from "../api/axios";

export const createConversation = async (
  data
) => {
  const response = await api.post(
    "/conversations",
    data
  );

  return response.data;
};

export const getConversations = async () => {
  const response = await api.get(
    "/conversations"
  );

  return response.data;
};

export const getMessages = async (
  conversationId
) => {
  const response = await api.get(
    `/conversations/${conversationId}/messages`
  );

  return response.data;
};

export const sendMessage = async (
  conversationId,
  body
) => {
  const response = await api.post(
    `/conversations/${conversationId}/messages`,
    {
      body
    }
  );

  return response.data;
};
