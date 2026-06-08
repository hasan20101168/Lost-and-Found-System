import api from "../api/axios";

export const getLostItems = async () => {
  const response = await api.get(
    "/lost-items"
  );

  return response.data;
};

export const createLostItem = async (
  itemData
) => {
  const response = await api.post(
    "/lost-items",
    itemData
  );

  return response.data;
};