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
