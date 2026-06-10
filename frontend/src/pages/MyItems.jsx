import {
  useEffect,
  useState
} from "react";

import api from "../api/axios";
import LostItemCard from "../components/LostItemCard";

function MyItems() {
  const [items, setItems] =
    useState([]);

  useEffect(() => {
    let isActive = true;

    const fetchItems = async () => {
      try {
        const res =
          await api.get(
            "/lost-items/my-items"
          );

        if (isActive) {
          setItems(res.data);
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
      <h1>My Lost Items</h1>

      {items.map((item) => (
        <LostItemCard
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
}

export default MyItems;
