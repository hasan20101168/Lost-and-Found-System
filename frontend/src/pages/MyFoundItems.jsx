import {
  useEffect,
  useState
} from "react";
import { getMyFoundItems } from "../services/foundItemService";
import FoundItemCard from "../components/FoundItemCard";

function MyFoundItems() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let isActive = true;

    const fetchItems = async () => {
      try {
        const data = await getMyFoundItems();

        if (isActive) {
          setItems(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchItems();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="container">
      <h1>My Found Items</h1>

      {items.length === 0 ? (
        <p>You have not reported any found items.</p>
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

export default MyFoundItems;
