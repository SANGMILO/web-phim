export default function Loading() {
  return (
    <div className="container-main" aria-busy="true" aria-label="Đang tải nội dung" style={{ paddingTop: 120, minHeight: '75vh' }}>
      <div className="skeleton" style={{ width: '42%', height: 38, marginBottom: 28 }} />
      <div className="poster-grid">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="skeleton" style={{ aspectRatio: '2 / 3' }} />
        ))}
      </div>
    </div>
  );
}

