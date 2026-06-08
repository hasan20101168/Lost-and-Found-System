import {
  useEffect,
  useState
} from "react";

import api from "../api/axios";

function MyItems() {
  const [items, setItems] =
    useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res =
        await api.get(
          "/lost-items/my-items"
        );

      setItems(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h1>My Lost Items</h1>

      {items.map((item) => (
        <div
          key={item.id}
          className="item-card"
        >
          <h3>{item.title}</h3>

          <p>
            {item.description}
          </p>

          <p>
            Status:
            {" "}
            {item.status}
          </p>
        </div>
      ))}
    </div>
  );
}

export default MyItems;