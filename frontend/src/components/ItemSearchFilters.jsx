function ItemSearchFilters({
  filters,
  options,
  onChange,
  onReset
}) {
  const handleChange = (e) => {
    onChange({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form className="filter-panel">
      <input
        type="search"
        name="keyword"
        placeholder="Search by keyword"
        value={filters.keyword}
        onChange={handleChange}
      />

      <select
        name="category"
        value={filters.category}
        onChange={handleChange}
      >
        <option value="">All categories</option>
        {options.categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        name="location"
        value={filters.location}
        onChange={handleChange}
      >
        <option value="">All locations</option>
        {options.locations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>

      <input
        type="date"
        name="date"
        value={filters.date}
        onChange={handleChange}
      />

      <select
        name="status"
        value={filters.status}
        onChange={handleChange}
      >
        <option value="">All statuses</option>
        {options.statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        name="sort"
        value={filters.sort}
        onChange={handleChange}
      >
        <option value="latest">Latest</option>
        <option value="relevant">Most relevant</option>
        <option value="updated">Recently updated</option>
      </select>

      <button
        type="button"
        className="secondary-button"
        onClick={onReset}
      >
        Reset
      </button>
    </form>
  );
}

export default ItemSearchFilters;
