function LostItemCard({ item }) {
  return (
    <div className="item-card">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="item-image"
        />
      )}

      <h3>{item.title}</h3>

      <p>
        <strong>Category:</strong> {item.category}
      </p>

      <p>
        <strong>Location:</strong> {item.location}
      </p>

      <p>{item.description}</p>

      <p>
        <strong>Status:</strong> {item.status}
      </p>
    </div>
  );
}

export default LostItemCard;
