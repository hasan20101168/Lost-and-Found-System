const buildDateRange = (date) => {
  if (!date) {
    return null;
  }

  const start = new Date(date);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    gte: start,
    lt: end
  };
};

const contains = (value) => ({
  contains: value,
  mode: "insensitive"
});

const buildItemWhere = (
  query,
  {
    locationField,
    dateField,
    keywordFields
  }
) => {
  const {
    keyword,
    category,
    location,
    date,
    status
  } = query;

  const where = {};

  if (keyword?.trim()) {
    const searchTerm = keyword.trim();

    where.OR = keywordFields.map((field) => ({
      [field]: contains(searchTerm)
    }));
  }

  if (category?.trim()) {
    where.category = contains(category.trim());
  }

  if (location?.trim()) {
    where[locationField] = contains(location.trim());
  }

  const dateRange = buildDateRange(date);

  if (dateRange) {
    where[dateField] = dateRange;
  }

  if (status?.trim()) {
    where.status = status.trim().toUpperCase();
  }

  return where;
};

const getOrderBy = (sort) => {
  if (sort === "updated") {
    return {
      updatedAt: "desc"
    };
  }

  return {
    createdAt: "desc"
  };
};

const scoreItem = (
  item,
  keyword,
  fields
) => {
  const searchTerm = keyword.trim().toLowerCase();

  return fields.reduce((score, field) => {
    const value =
      item[field]?.toLowerCase() || "";

    if (value === searchTerm) {
      return score + 8;
    }

    if (value.startsWith(searchTerm)) {
      return score + 5;
    }

    if (value.includes(searchTerm)) {
      return score + 2;
    }

    return score;
  }, 0);
};

const sortByRelevance = (
  items,
  keyword,
  fields
) => {
  if (!keyword?.trim()) {
    return items;
  }

  return [...items].sort((a, b) => {
    const scoreDifference =
      scoreItem(b, keyword, fields) -
      scoreItem(a, keyword, fields);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return (
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
    );
  });
};

module.exports = {
  buildItemWhere,
  getOrderBy,
  sortByRelevance
};
