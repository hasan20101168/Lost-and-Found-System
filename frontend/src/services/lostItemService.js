import api from "../api/axios";

export const getLostItems = async (
  filters = {}
) => {
  const response = await api.get(
    "/lost-items",
    {
      params: filters
    }
  );

  return response.data;
};

export const getLostItemFilters = async () => {
  const response = await api.get(
    "/lost-items/filters"
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

export const getMyLostItems = async () => {
  const response = await api.get(
    "/lost-items/my-items"
  );

  return response.data;
};

export const updateLostItem = async (
  id,
  itemData
) => {
  const response = await api.put(
    `/lost-items/${id}`,
    itemData
  );

  return response.data;
};

export const deleteLostItem = async (id) => {
  const response = await api.delete(
    `/lost-items/${id}`
  );

  return response.data;
};
