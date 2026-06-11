import api from "../api/axios";

export const getFoundItems = async (
  filters = {}
) => {
  const response = await api.get(
    "/found-items",
    {
      params: filters
    }
  );

  return response.data;
};

export const getFoundItemFilters = async () => {
  const response = await api.get(
    "/found-items/filters"
  );

  return response.data;
};

export const getMyFoundItems = async () => {
  const response = await api.get(
    "/found-items/my-items"
  );

  return response.data;
};

export const createFoundItem = async (
  itemData
) => {
  const response = await api.post(
    "/found-items",
    itemData
  );

  return response.data;
};
