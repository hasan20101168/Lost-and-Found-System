import { useEffect, useState } from "react";
import { getLostItems } from "../services/lostItemService";
import LostItemCard from "../components/LostItemCard";

function LostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const data = await getLostItems();
      setItems(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container">
      <h1>Lost Items</h1>

      {items.length === 0 ? (
        <p>No lost items found.</p>
      ) : (
        items.map((item) => (
          <LostItemCard key={item.id} item={item} />
        ))
      )}
    </div>
  );
}

export default LostItems;