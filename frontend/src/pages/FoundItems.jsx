import {
  useEffect,
  useState
} from "react";
import {
  getFoundItemFilters,
  getFoundItems
} from "../services/foundItemService";
import FoundItemCard from "../components/FoundItemCard";
import ItemSearchFilters from "../components/ItemSearchFilters";

const defaultFilters = {
  keyword: "",
  category: "",
  location: "",
  date: "",
  status: "",
  sort: "latest"
};

const defaultOptions = {
  categories: [],
  locations: [],
  statuses: []
};

function FoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [filterOptions, setFilterOptions] =
    useState(defaultOptions);

  useEffect(() => {
    let isActive = true;

    const fetchItems = async () => {
      try {
        const data = await getFoundItems(filters);

        if (isActive) {
          setItems(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      isActive = false;
    };
  }, [filters]);

  useEffect(() => {
    let isActive = true;

    const fetchFilters = async () => {
      try {
        const data = await getFoundItemFilters();

        if (isActive) {
          setFilterOptions(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchFilters();

    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container">
      <h1>Found Items</h1>

      <ItemSearchFilters
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {items.length === 0 ? (
        <p>No found items reported.</p>
      ) : (
        items.map((item) => (
          <FoundItemCard
            key={item.id}
            item={item}
          />
        ))
      )}
    </div>
  );
}

export default FoundItems;
